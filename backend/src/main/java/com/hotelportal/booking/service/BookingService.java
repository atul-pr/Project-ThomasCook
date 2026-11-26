package com.hotelportal.booking.service;

import com.hotelportal.availability.service.AvailabilityService;
import com.hotelportal.booking.dto.BookingResponse;
import com.hotelportal.booking.dto.CancelBookingRequest;
import com.hotelportal.booking.dto.CreateBookingRequest;
import com.hotelportal.booking.entity.Booking;
import com.hotelportal.booking.entity.BookingStatus;
import com.hotelportal.booking.repository.BookingRepository;
import com.hotelportal.common.exception.BadRequestException;
import com.hotelportal.common.exception.BookingConflictException;
import com.hotelportal.common.exception.ResourceNotFoundException;
import com.hotelportal.common.exception.RoomUnavailableException;
import com.hotelportal.hotel.repository.HotelRepository;
import com.hotelportal.pricing.dto.PriceBreakdown;
import com.hotelportal.pricing.service.PricingService;
import com.hotelportal.room.entity.RoomType;
import com.hotelportal.room.repository.RoomTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.Optional;

@Service
public class BookingService {

    public record BookingCreationResult(BookingResponse booking, boolean idempotentReplay) {
    }

    private final HotelRepository hotelRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final BookingRepository bookingRepository;
    private final AvailabilityService availabilityService;
    private final PricingService pricingService;
    private final BookingReferenceGenerator referenceGenerator;

    public BookingService(
            HotelRepository hotelRepository,
            RoomTypeRepository roomTypeRepository,
            BookingRepository bookingRepository,
            AvailabilityService availabilityService,
            PricingService pricingService,
            BookingReferenceGenerator referenceGenerator
    ) {
        this.hotelRepository = hotelRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.bookingRepository = bookingRepository;
        this.availabilityService = availabilityService;
        this.pricingService = pricingService;
        this.referenceGenerator = referenceGenerator;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingResponse createBooking(CreateBookingRequest request) {
        return createBookingWithIdempotency(request, request.idempotencyKey()).booking();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingCreationResult createBookingWithIdempotency(CreateBookingRequest request, String idempotencyKeyHeader) {
        availabilityService.validateDateRange(request.checkInDate(), request.checkOutDate());

        String normalizedEmail = normalizeEmail(request.guestEmail());
        String normalizedIdempotencyKey = normalizeIdempotencyKey(
                idempotencyKeyHeader != null && !idempotencyKeyHeader.isBlank()
                        ? idempotencyKeyHeader
                        : request.idempotencyKey()
        );

        // Acquire pessimistic write lock (SELECT ... FOR UPDATE) on the RoomType row first
        // under READ_COMMITTED so subsequent overlap and idempotency checks always see latest committed rows.
        RoomType roomType = roomTypeRepository.findByIdWithHotelForUpdate(request.roomTypeId())
                .orElseThrow(() -> {
                    if (request.hotelId() != null && !hotelRepository.existsById(request.hotelId())) {
                        return new ResourceNotFoundException("Hotel not found with id: " + request.hotelId());
                    }
                    return new ResourceNotFoundException("Room type not found with id: " + request.roomTypeId());
                });

        if (request.hotelId() != null && !roomType.getHotel().getId().equals(request.hotelId())) {
            if (!hotelRepository.existsById(request.hotelId())) {
                throw new ResourceNotFoundException("Hotel not found with id: " + request.hotelId());
            }
            throw new BadRequestException(
                    "Room type " + request.roomTypeId() + " does not belong to hotel " + request.hotelId()
            );
        }

        // Check idempotency inside the RoomType lock to guard against concurrent duplicate clicks.
        if (normalizedIdempotencyKey != null) {
            Optional<Booking> existingUnderLock = bookingRepository.findByIdempotencyKeyWithDetails(normalizedIdempotencyKey);
            if (existingUnderLock.isPresent()) {
                return verifyAndReplay(existingUnderLock.get(), request, normalizedEmail);
            }
        }

        int guests = request.guests() != null ? request.guests() : 1;
        if (guests > roomType.getMaxGuests()) {
            throw new BadRequestException(
                    "Selected room supports up to " + roomType.getMaxGuests() + " guests"
            );
        }

        long overlappingConfirmed = bookingRepository.countOverlappingBookings(
                roomType.getId(),
                BookingStatus.CONFIRMED,
                request.checkInDate(),
                request.checkOutDate()
        );

        if (overlappingConfirmed >= roomType.getTotalRooms()) {
            throw new RoomUnavailableException(
                    "No rooms available for '" + roomType.getName() + "' between "
                            + request.checkInDate() + " and " + request.checkOutDate()
            );
        }

        PriceBreakdown price = pricingService.calculatePrice(
                roomType.getBasePricePerNight(),
                roomType.getCurrency(),
                request.checkInDate(),
                request.checkOutDate()
        );

        Booking booking = new Booking();
        booking.setBookingReference(generateUniqueReference());
        booking.setHotel(roomType.getHotel());
        booking.setRoomType(roomType);
        booking.setGuestName(request.guestName().trim());
        booking.setGuestEmail(normalizedEmail);
        booking.setGuestPhone(request.guestPhone() != null && !request.guestPhone().isBlank()
                ? request.guestPhone().trim()
                : null);
        booking.setCheckInDate(request.checkInDate());
        booking.setCheckOutDate(request.checkOutDate());
        booking.setGuests(guests);
        booking.setNights(price.nights());
        booking.setPricePerNightSnapshot(price.pricePerNight());
        booking.setTaxAmountSnapshot(price.taxAmount());
        booking.setTotalAmountSnapshot(price.totalAmount());
        booking.setCurrency(price.currency());
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setSpecialRequests(request.specialRequests() != null && !request.specialRequests().isBlank()
                ? request.specialRequests().trim()
                : null);
        booking.setIdempotencyKey(normalizedIdempotencyKey);

        Booking saved = bookingRepository.save(booking);
        return new BookingCreationResult(BookingResponse.from(saved), false);
    }

    @Transactional(readOnly = true)
    public BookingResponse lookupBooking(String reference, String email) {
        String normalizedRef = normalizeReference(reference);
        String normalizedEmail = normalizeEmail(email);

        Booking booking = bookingRepository.findByReferenceAndEmail(normalizedRef, normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No booking found matching reference '" + normalizedRef + "' and provided email"
                ));

        return BookingResponse.from(booking);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingResponse cancelBooking(String reference, CancelBookingRequest request) {
        String normalizedRef = normalizeReference(reference);
        String normalizedEmail = normalizeEmail(request.email());

        Booking lookup = bookingRepository.findByReferenceAndEmail(normalizedRef, normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No booking found matching reference '" + normalizedRef + "' and provided email"
                ));

        // Lock associated RoomType row first to keep lock ordering consistent with createBooking.
        roomTypeRepository.findByIdWithHotelForUpdate(lookup.getRoomType().getId());

        Booking booking = bookingRepository.findByReferenceAndEmailForUpdate(normalizedRef, normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No booking found matching reference '" + normalizedRef + "' and provided email"
                ));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BookingConflictException("Booking '" + normalizedRef + "' is already cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(Instant.now());
        Booking updated = bookingRepository.save(booking);
        return BookingResponse.from(updated);
    }

    private BookingCreationResult verifyAndReplay(
            Booking existing,
            CreateBookingRequest request,
            String normalizedEmail
    ) {
        boolean samePayload = existing.getRoomType().getId().equals(request.roomTypeId())
                && existing.getGuestEmail().equalsIgnoreCase(normalizedEmail)
                && existing.getCheckInDate().equals(request.checkInDate())
                && existing.getCheckOutDate().equals(request.checkOutDate());
        if (!samePayload) {
            throw new BookingConflictException(
                    "Idempotency key has already been used for a different booking request"
            );
        }
        return new BookingCreationResult(BookingResponse.from(existing), true);
    }

    private String generateUniqueReference() {
        for (int attempt = 0; attempt < 10; attempt++) {
            String candidate = referenceGenerator.generate();
            if (!bookingRepository.existsByBookingReference(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Unable to generate a unique booking reference");
    }

    private String normalizeReference(String reference) {
        if (reference == null || reference.isBlank()) {
            throw new BadRequestException("Booking reference is required");
        }
        return reference.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Guest email is required");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeIdempotencyKey(String key) {
        if (key == null || key.isBlank()) {
            return null;
        }
        String trimmed = key.trim();
        if (trimmed.length() > 100) {
            throw new BadRequestException("Idempotency-Key must be at most 100 characters");
        }
        return trimmed;
    }
}

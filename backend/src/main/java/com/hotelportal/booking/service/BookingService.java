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
import com.hotelportal.pricing.dto.PriceBreakdown;
import com.hotelportal.pricing.service.PricingService;
import com.hotelportal.room.entity.RoomType;
import com.hotelportal.room.repository.RoomTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;

@Service
public class BookingService {

    private final RoomTypeRepository roomTypeRepository;
    private final BookingRepository bookingRepository;
    private final AvailabilityService availabilityService;
    private final PricingService pricingService;
    private final BookingReferenceGenerator referenceGenerator;

    public BookingService(
            RoomTypeRepository roomTypeRepository,
            BookingRepository bookingRepository,
            AvailabilityService availabilityService,
            PricingService pricingService,
            BookingReferenceGenerator referenceGenerator
    ) {
        this.roomTypeRepository = roomTypeRepository;
        this.bookingRepository = bookingRepository;
        this.availabilityService = availabilityService;
        this.pricingService = pricingService;
        this.referenceGenerator = referenceGenerator;
    }

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        availabilityService.validateDateRange(request.checkInDate(), request.checkOutDate());

        // Acquire pessimistic write lock (SELECT ... FOR UPDATE) on the RoomType row
        // to serialize concurrent bookings for the same room type and prevent phantom overbooking.
        RoomType roomType = roomTypeRepository.findByIdWithHotelForUpdate(request.roomTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + request.roomTypeId()));

        if (request.guests() > roomType.getMaxGuests()) {
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
        booking.setGuestEmail(request.guestEmail().trim().toLowerCase(Locale.ROOT));
        booking.setGuestPhone(request.guestPhone() != null && !request.guestPhone().isBlank()
                ? request.guestPhone().trim()
                : null);
        booking.setCheckInDate(request.checkInDate());
        booking.setCheckOutDate(request.checkOutDate());
        booking.setGuests(request.guests());
        booking.setNights(price.nights());
        booking.setPricePerNightSnapshot(price.pricePerNight());
        booking.setTaxAmountSnapshot(price.taxAmount());
        booking.setTotalAmountSnapshot(price.totalAmount());
        booking.setCurrency(price.currency());
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setSpecialRequests(request.specialRequests() != null && !request.specialRequests().isBlank()
                ? request.specialRequests().trim()
                : null);

        Booking saved = bookingRepository.save(booking);
        return BookingResponse.from(saved);
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

    @Transactional
    public BookingResponse cancelBooking(String reference, CancelBookingRequest request) {
        String normalizedRef = normalizeReference(reference);
        String normalizedEmail = normalizeEmail(request.email());

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
}

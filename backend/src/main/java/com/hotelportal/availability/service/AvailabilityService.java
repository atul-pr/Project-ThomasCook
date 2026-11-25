package com.hotelportal.availability.service;

import com.hotelportal.availability.dto.AlternativeDateSuggestion;
import com.hotelportal.availability.dto.AvailabilityResponse;
import com.hotelportal.booking.entity.Booking;
import com.hotelportal.booking.entity.BookingStatus;
import com.hotelportal.booking.repository.BookingRepository;
import com.hotelportal.common.exception.BadRequestException;
import com.hotelportal.common.exception.InvalidDateRangeException;
import com.hotelportal.common.exception.ResourceNotFoundException;
import com.hotelportal.pricing.dto.PriceBreakdown;
import com.hotelportal.pricing.service.PricingService;
import com.hotelportal.room.entity.RoomType;
import com.hotelportal.room.repository.RoomTypeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AvailabilityService {

    private static final int ALTERNATIVE_LOOKAHEAD_DAYS = 7;
    private static final int MAX_ALTERNATIVE_SUGGESTIONS = 3;

    private final RoomTypeRepository roomTypeRepository;
    private final BookingRepository bookingRepository;
    private final PricingService pricingService;
    private final int maxStayNights;

    public AvailabilityService(
            RoomTypeRepository roomTypeRepository,
            BookingRepository bookingRepository,
            PricingService pricingService,
            @Value("${app.pricing.max-stay-nights:30}") int maxStayNights
    ) {
        this.roomTypeRepository = roomTypeRepository;
        this.bookingRepository = bookingRepository;
        this.pricingService = pricingService;
        this.maxStayNights = maxStayNights;
    }

    public void validateDateRange(LocalDate checkIn, LocalDate checkOut) {
        if (checkIn == null || checkOut == null) {
            throw new InvalidDateRangeException("Both check-in and check-out dates are required");
        }
        LocalDate today = LocalDate.now();
        if (checkIn.isBefore(today)) {
            throw new InvalidDateRangeException("Check-in date cannot be in the past");
        }
        if (!checkOut.isAfter(checkIn)) {
            throw new InvalidDateRangeException("Check-out date must be after check-in date");
        }
        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights > maxStayNights) {
            throw new InvalidDateRangeException("Maximum stay duration is " + maxStayNights + " nights");
        }
    }

    public AvailabilityResponse checkRoomAvailability(Long roomTypeId, LocalDate checkIn, LocalDate checkOut, int guests) {
        validateDateRange(checkIn, checkOut);
        if (guests < 1) {
            throw new BadRequestException("Guest count must be at least 1");
        }

        RoomType roomType = roomTypeRepository.findByIdWithHotel(roomTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + roomTypeId));

        long bookedCount = bookingRepository.countOverlappingBookings(
                roomTypeId,
                BookingStatus.CONFIRMED,
                checkIn,
                checkOut
        );
        int bookedRooms = Math.toIntExact(bookedCount);
        int availableRooms = Math.max(0, roomType.getTotalRooms() - bookedRooms);
        boolean capacitySupported = guests <= roomType.getMaxGuests();
        boolean available = capacitySupported && availableRooms > 0;

        PriceBreakdown priceBreakdown = pricingService.calculatePrice(
                roomType.getBasePricePerNight(),
                roomType.getCurrency(),
                checkIn,
                checkOut
        );

        List<AlternativeDateSuggestion> alternatives = (capacitySupported && availableRooms == 0)
                ? findAlternativeDateRanges(List.of(roomType), checkIn, checkOut, guests)
                        .getOrDefault(roomTypeId, Collections.emptyList())
                : Collections.emptyList();

        return new AvailabilityResponse(
                roomType.getId(),
                roomType.getHotel().getId(),
                roomType.getName(),
                checkIn,
                checkOut,
                guests,
                roomType.getMaxGuests(),
                capacitySupported,
                roomType.getTotalRooms(),
                bookedRooms,
                availableRooms,
                available,
                priceBreakdown,
                alternatives
        );
    }

    public List<AlternativeDateSuggestion> getAlternativeDateSuggestions(
            Long roomTypeId,
            LocalDate checkIn,
            LocalDate checkOut,
            int guests
    ) {
        validateDateRange(checkIn, checkOut);
        if (guests < 1) {
            throw new BadRequestException("Guest count must be at least 1");
        }
        RoomType roomType = roomTypeRepository.findByIdWithHotel(roomTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Room type not found with id: " + roomTypeId));
        return findAlternativeDateRanges(List.of(roomType), checkIn, checkOut, guests)
                .getOrDefault(roomTypeId, Collections.emptyList());
    }

    public Map<Long, List<AlternativeDateSuggestion>> findAlternativeDateRanges(
            List<RoomType> unavailableRoomTypes,
            LocalDate requestedCheckIn,
            LocalDate requestedCheckOut,
            int guests
    ) {
        if (unavailableRoomTypes == null || unavailableRoomTypes.isEmpty()) {
            return Collections.emptyMap();
        }
        validateDateRange(requestedCheckIn, requestedCheckOut);

        List<RoomType> eligibleTypes = unavailableRoomTypes.stream()
                .filter(rt -> guests <= rt.getMaxGuests())
                .toList();
        if (eligibleTypes.isEmpty()) {
            return Collections.emptyMap();
        }

        int nights = Math.toIntExact(ChronoUnit.DAYS.between(requestedCheckIn, requestedCheckOut));
        LocalDate windowStart = requestedCheckIn.plusDays(1);
        LocalDate windowEnd = requestedCheckIn.plusDays(ALTERNATIVE_LOOKAHEAD_DAYS + (long) nights);

        List<Long> roomTypeIds = eligibleTypes.stream().map(RoomType::getId).toList();
        Map<Long, List<Booking>> bookingsByRoom = bookingRepository
                .findOverlappingBookingsInWindow(roomTypeIds, BookingStatus.CONFIRMED, windowStart, windowEnd)
                .stream()
                .collect(Collectors.groupingBy(b -> b.getRoomType().getId()));

        Map<Long, List<AlternativeDateSuggestion>> result = new HashMap<>();
        for (RoomType roomType : eligibleTypes) {
            List<Booking> roomBookings = bookingsByRoom.getOrDefault(roomType.getId(), Collections.emptyList());
            List<AlternativeDateSuggestion> suggestions = new ArrayList<>(MAX_ALTERNATIVE_SUGGESTIONS);

            for (int offset = 1; offset <= ALTERNATIVE_LOOKAHEAD_DAYS; offset++) {
                LocalDate candIn = requestedCheckIn.plusDays(offset);
                LocalDate candOut = candIn.plusDays(nights);

                int overlapping = 0;
                for (Booking booking : roomBookings) {
                    if (booking.getCheckInDate().isBefore(candOut) && booking.getCheckOutDate().isAfter(candIn)) {
                        overlapping++;
                    }
                }

                int freeRooms = roomType.getTotalRooms() - overlapping;
                if (freeRooms > 0) {
                    PriceBreakdown quote = pricingService.calculatePrice(
                            roomType.getBasePricePerNight(),
                            roomType.getCurrency(),
                            candIn,
                            candOut
                    );
                    suggestions.add(new AlternativeDateSuggestion(candIn, candOut, nights, freeRooms, quote));
                    if (suggestions.size() == MAX_ALTERNATIVE_SUGGESTIONS) {
                        break;
                    }
                }
            }
            result.put(roomType.getId(), suggestions);
        }
        return result;
    }

    public Map<Long, Integer> getBookedCountsByRoomType(Collection<Long> roomTypeIds, LocalDate checkIn, LocalDate checkOut) {
        if (roomTypeIds == null || roomTypeIds.isEmpty()) {
            return Collections.emptyMap();
        }
        validateDateRange(checkIn, checkOut);
        List<Object[]> rows = bookingRepository.countOverlappingBookingsByRoomTypeIds(
                roomTypeIds,
                BookingStatus.CONFIRMED,
                checkIn,
                checkOut
        );
        Map<Long, Integer> counts = new HashMap<>();
        for (Object[] row : rows) {
            Long roomTypeId = (Long) row[0];
            int count = ((Number) row[1]).intValue();
            counts.put(roomTypeId, count);
        }
        return counts;
    }
}

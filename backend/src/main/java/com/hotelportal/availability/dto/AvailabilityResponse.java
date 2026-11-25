package com.hotelportal.availability.dto;

import com.hotelportal.pricing.dto.PriceBreakdown;

import java.time.LocalDate;
import java.util.List;

public record AvailabilityResponse(
        Long roomTypeId,
        Long hotelId,
        String roomTypeName,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        int guests,
        int maxGuests,
        boolean capacitySupported,
        int totalRooms,
        int bookedRooms,
        int availableRooms,
        boolean available,
        PriceBreakdown priceBreakdown,
        List<AlternativeDateSuggestion> alternativeDates
) {
}

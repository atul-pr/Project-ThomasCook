package com.hotelportal.room.dto;

import com.hotelportal.availability.dto.AlternativeDateSuggestion;
import com.hotelportal.pricing.dto.PriceBreakdown;

import java.math.BigDecimal;
import java.util.List;

public record RoomTypeResponse(
        Long id,
        Long hotelId,
        String name,
        String description,
        BigDecimal basePricePerNight,
        String currency,
        int maxGuests,
        int totalRooms,
        Integer availableRooms,
        boolean canAccommodateGuests,
        List<String> amenities,
        PriceBreakdown priceBreakdown,
        List<AlternativeDateSuggestion> alternativeDates
) {
}

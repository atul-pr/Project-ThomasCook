package com.hotelportal.availability.dto;

import com.hotelportal.pricing.dto.PriceBreakdown;

import java.time.LocalDate;

public record AlternativeDateSuggestion(
        LocalDate checkInDate,
        LocalDate checkOutDate,
        int nights,
        int availableRooms,
        PriceBreakdown priceBreakdown
) {
}

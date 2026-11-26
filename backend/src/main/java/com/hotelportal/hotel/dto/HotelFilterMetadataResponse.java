package com.hotelportal.hotel.dto;

import java.math.BigDecimal;
import java.util.List;

public record HotelFilterMetadataResponse(
        BigDecimal minPricePerNight,
        BigDecimal maxPricePerNight,
        String currency,
        List<String> amenities
) {
}

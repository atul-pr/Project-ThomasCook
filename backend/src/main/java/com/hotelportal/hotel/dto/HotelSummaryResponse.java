package com.hotelportal.hotel.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

public record HotelSummaryResponse(
        Long id,
        String name,
        String city,
        String country,
        String address,
        String description,
        int starRating,
        List<String> amenities,
        String imageUrl,
        BigDecimal startingPricePerNight,
        String currency,
        int matchingRoomTypesCount,
        Integer totalAvailableRooms
) {
    @JsonProperty("location")
    public String location() {
        return city;
    }

    @JsonProperty("rating")
    public int rating() {
        return starRating;
    }
}

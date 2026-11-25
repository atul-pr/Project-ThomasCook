package com.hotelportal.hotel.dto;

import java.util.List;

public record HotelDetailResponse(
        Long id,
        String name,
        String city,
        String country,
        String address,
        String description,
        int starRating,
        List<String> amenities,
        String imageUrl
) {
}

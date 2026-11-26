package com.hotelportal.availability.dto;

import com.hotelportal.room.dto.RoomTypeResponse;

import java.time.LocalDate;
import java.util.List;

public record HotelAvailabilityResponse(
        Long hotelId,
        String hotelName,
        String location,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        int nights,
        int guests,
        int totalAvailableRooms,
        List<RoomTypeResponse> rooms
) {
}

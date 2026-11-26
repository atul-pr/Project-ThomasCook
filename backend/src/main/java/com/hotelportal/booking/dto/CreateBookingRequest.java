package com.hotelportal.booking.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateBookingRequest(
        Long hotelId,

        @NotNull(message = "Room type ID is required")
        Long roomTypeId,

        @NotBlank(message = "Guest name is required")
        @Size(max = 120, message = "Guest name must be at most 120 characters")
        String guestName,

        @NotBlank(message = "Guest email is required")
        @Email(message = "Guest email must be valid")
        @Size(max = 180, message = "Guest email must be at most 180 characters")
        String guestEmail,

        @Size(max = 30, message = "Guest phone must be at most 30 characters")
        String guestPhone,

        @NotNull(message = "Check-in date is required")
        @JsonAlias("checkIn")
        LocalDate checkInDate,

        @NotNull(message = "Check-out date is required")
        @JsonAlias("checkOut")
        LocalDate checkOutDate,

        @Min(value = 1, message = "Guests must be at least 1")
        @Max(value = 10, message = "Guests cannot exceed 10")
        Integer guests,

        @Size(max = 500, message = "Special requests must be at most 500 characters")
        String specialRequests,

        @Size(max = 100, message = "Idempotency key must be at most 100 characters")
        String idempotencyKey
) {
    public CreateBookingRequest {
        if (guests == null) {
            guests = 1;
        }
    }

    public CreateBookingRequest(
            Long roomTypeId,
            String guestName,
            String guestEmail,
            String guestPhone,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            int guests,
            String specialRequests
    ) {
        this(null, roomTypeId, guestName, guestEmail, guestPhone, checkInDate, checkOutDate, guests, specialRequests, null);
    }
}

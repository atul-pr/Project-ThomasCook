package com.hotelportal.booking.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateBookingRequest(
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
        LocalDate checkInDate,

        @NotNull(message = "Check-out date is required")
        LocalDate checkOutDate,

        @Min(value = 1, message = "Guests must be at least 1")
        @Max(value = 10, message = "Guests cannot exceed 10")
        int guests,

        @Size(max = 500, message = "Special requests must be at most 500 characters")
        String specialRequests
) {
}

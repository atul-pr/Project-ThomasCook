package com.hotelportal.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hotelportal.booking.entity.Booking;
import com.hotelportal.booking.entity.BookingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record BookingResponse(
        String bookingReference,
        BookingStatus status,
        Long hotelId,
        String hotelName,
        String hotelCity,
        Long roomTypeId,
        String roomTypeName,
        String guestName,
        String guestEmail,
        String guestPhone,
        LocalDate checkInDate,
        LocalDate checkOutDate,
        int guests,
        int nights,
        BigDecimal pricePerNightSnapshot,
        BigDecimal taxAmountSnapshot,
        BigDecimal totalAmountSnapshot,
        String currency,
        String specialRequests,
        Instant createdAt,
        Instant cancelledAt
) {
    @JsonProperty("email")
    public String email() {
        return guestEmail;
    }

    @JsonProperty("checkIn")
    public LocalDate checkIn() {
        return checkInDate;
    }

    @JsonProperty("checkOut")
    public LocalDate checkOut() {
        return checkOutDate;
    }

    @JsonProperty("numberOfNights")
    public int numberOfNights() {
        return nights;
    }

    @JsonProperty("pricePerNight")
    public BigDecimal pricePerNight() {
        return pricePerNightSnapshot;
    }

    @JsonProperty("totalAmount")
    public BigDecimal totalAmount() {
        return totalAmountSnapshot;
    }

    public static BookingResponse from(Booking booking) {
        return new BookingResponse(
                booking.getBookingReference(),
                booking.getStatus(),
                booking.getHotel().getId(),
                booking.getHotel().getName(),
                booking.getHotel().getCity(),
                booking.getRoomType().getId(),
                booking.getRoomType().getName(),
                booking.getGuestName(),
                booking.getGuestEmail(),
                booking.getGuestPhone(),
                booking.getCheckInDate(),
                booking.getCheckOutDate(),
                booking.getGuests(),
                booking.getNights(),
                booking.getPricePerNightSnapshot(),
                booking.getTaxAmountSnapshot(),
                booking.getTotalAmountSnapshot(),
                booking.getCurrency(),
                booking.getSpecialRequests(),
                booking.getCreatedAt(),
                booking.getCancelledAt()
        );
    }
}

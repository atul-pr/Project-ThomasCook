package com.hotelportal.booking.controller;

import com.hotelportal.booking.dto.BookingResponse;
import com.hotelportal.booking.dto.CancelBookingRequest;
import com.hotelportal.booking.dto.CreateBookingRequest;
import com.hotelportal.booking.service.BookingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse createBooking(@Valid @RequestBody CreateBookingRequest request) {
        return bookingService.createBooking(request);
    }

    @GetMapping("/lookup")
    public BookingResponse lookupBooking(
            @RequestParam @NotBlank(message = "Booking reference is required") String reference,
            @RequestParam @NotBlank(message = "Email is required") @Email(message = "Email must be valid") String email
    ) {
        return bookingService.lookupBooking(reference, email);
    }

    @PostMapping("/{reference}/cancel")
    public BookingResponse cancelBooking(
            @PathVariable String reference,
            @Valid @RequestBody CancelBookingRequest request
    ) {
        return bookingService.cancelBooking(reference, request);
    }
}

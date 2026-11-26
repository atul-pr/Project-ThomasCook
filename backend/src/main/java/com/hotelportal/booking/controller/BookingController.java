package com.hotelportal.booking.controller;

import com.hotelportal.booking.dto.BookingResponse;
import com.hotelportal.booking.dto.CancelBookingRequest;
import com.hotelportal.booking.dto.CreateBookingRequest;
import com.hotelportal.booking.service.BookingService;
import com.hotelportal.booking.service.BookingService.BookingCreationResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping({"/api/v1/bookings", "/api/bookings"})
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        BookingCreationResult result = bookingService.createBookingWithIdempotency(request, idempotencyKey);
        HttpStatus status = result.idempotentReplay() ? HttpStatus.OK : HttpStatus.CREATED;
        return ResponseEntity.status(status).body(result.booking());
    }

    @GetMapping("/lookup")
    public BookingResponse lookupBooking(
            @RequestParam @NotBlank(message = "Booking reference is required") String reference,
            @RequestParam @NotBlank(message = "Email is required") @Email(message = "Email must be valid") String email
    ) {
        return bookingService.lookupBooking(reference, email);
    }

    @GetMapping("/{reference}")
    public BookingResponse getBookingByReference(
            @PathVariable String reference,
            @RequestParam @NotBlank(message = "Email is required") @Email(message = "Email must be valid") String email
    ) {
        return bookingService.lookupBooking(reference, email);
    }

    @RequestMapping(value = "/{reference}/cancel", method = {RequestMethod.PATCH, RequestMethod.POST})
    public BookingResponse cancelBooking(
            @PathVariable String reference,
            @Valid @RequestBody CancelBookingRequest request
    ) {
        return bookingService.cancelBooking(reference, request);
    }
}

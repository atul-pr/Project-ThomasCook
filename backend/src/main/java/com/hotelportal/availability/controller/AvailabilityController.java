package com.hotelportal.availability.controller;

import com.hotelportal.availability.dto.AlternativeDateSuggestion;
import com.hotelportal.availability.dto.AvailabilityResponse;
import com.hotelportal.availability.service.AvailabilityService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping({"/api/v1/availability", "/api/availability"})
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @GetMapping
    public AvailabilityResponse checkAvailability(
            @RequestParam Long roomTypeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(defaultValue = "1") int guests
    ) {
        return availabilityService.checkRoomAvailability(roomTypeId, checkIn, checkOut, guests);
    }

    @GetMapping("/alternatives")
    public List<AlternativeDateSuggestion> getAlternativeDates(
            @RequestParam Long roomTypeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(defaultValue = "1") int guests
    ) {
        return availabilityService.getAlternativeDateSuggestions(roomTypeId, checkIn, checkOut, guests);
    }
}

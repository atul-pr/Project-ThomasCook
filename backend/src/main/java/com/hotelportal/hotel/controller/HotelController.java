package com.hotelportal.hotel.controller;

import com.hotelportal.availability.dto.HotelAvailabilityResponse;
import com.hotelportal.common.dto.PageResponse;
import com.hotelportal.hotel.dto.HotelDetailResponse;
import com.hotelportal.hotel.dto.HotelFilterMetadataResponse;
import com.hotelportal.hotel.dto.HotelSummaryResponse;
import com.hotelportal.hotel.service.HotelService;
import com.hotelportal.room.service.RoomService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping({"/api/v1/hotels", "/api/hotels"})
public class HotelController {

    private final HotelService hotelService;
    private final RoomService roomService;

    public HotelController(HotelService hotelService, RoomService roomService) {
        this.hotelService = hotelService;
        this.roomService = roomService;
    }

    @GetMapping
    public PageResponse<HotelSummaryResponse> searchHotels(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(defaultValue = "1") int guests,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minRating,
            @RequestParam(required = false) Integer rating,
            @RequestParam(required = false) List<String> amenities,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "starRating") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String sort
    ) {
        String effectiveLocation = (location != null && !location.isBlank()) ? location : city;
        Integer effectiveMinRating = minRating != null ? minRating : rating;
        String effectiveSortBy = sortBy;
        String effectiveDirection = direction;
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            effectiveSortBy = parts[0].trim();
            if (parts.length > 1 && !parts[1].isBlank()) {
                effectiveDirection = parts[1].trim();
            }
        }
        return hotelService.searchHotels(
                effectiveLocation,
                checkIn,
                checkOut,
                guests,
                minPrice,
                maxPrice,
                effectiveMinRating,
                amenities,
                page,
                size,
                effectiveSortBy,
                effectiveDirection
        );
    }

    @GetMapping("/cities")
    public List<String> getAvailableCities() {
        return hotelService.getAvailableCities();
    }

    @GetMapping("/filter-metadata")
    public HotelFilterMetadataResponse getFilterMetadata() {
        return hotelService.getFilterMetadata();
    }

    @GetMapping("/{hotelId}")
    public HotelDetailResponse getHotelById(@PathVariable Long hotelId) {
        return hotelService.getHotelById(hotelId);
    }

    @GetMapping("/{hotelId}/availability")
    public HotelAvailabilityResponse getHotelAvailability(
            @PathVariable Long hotelId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(defaultValue = "1") int guests
    ) {
        return roomService.getHotelAvailability(hotelId, checkIn, checkOut, guests);
    }
}

package com.hotelportal.hotel.controller;

import com.hotelportal.common.dto.PageResponse;
import com.hotelportal.hotel.dto.HotelDetailResponse;
import com.hotelportal.hotel.dto.HotelSummaryResponse;
import com.hotelportal.hotel.service.HotelService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/hotels")
public class HotelController {

    private final HotelService hotelService;

    public HotelController(HotelService hotelService) {
        this.hotelService = hotelService;
    }

    @GetMapping
    public PageResponse<HotelSummaryResponse> searchHotels(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkIn,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkOut,
            @RequestParam(defaultValue = "1") int guests,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "starRating") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        return hotelService.searchHotels(city, checkIn, checkOut, guests, page, size, sortBy, direction);
    }

    @GetMapping("/cities")
    public List<String> getAvailableCities() {
        return hotelService.getAvailableCities();
    }

    @GetMapping("/{hotelId}")
    public HotelDetailResponse getHotelById(@PathVariable Long hotelId) {
        return hotelService.getHotelById(hotelId);
    }
}

package com.hotelportal.hotel.service;

import com.hotelportal.availability.service.AvailabilityService;
import com.hotelportal.common.dto.PageResponse;
import com.hotelportal.common.exception.BadRequestException;
import com.hotelportal.common.exception.ResourceNotFoundException;
import com.hotelportal.hotel.dto.HotelDetailResponse;
import com.hotelportal.hotel.dto.HotelSummaryResponse;
import com.hotelportal.hotel.entity.Hotel;
import com.hotelportal.hotel.repository.HotelRepository;
import com.hotelportal.room.entity.RoomType;
import com.hotelportal.room.repository.RoomTypeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class HotelService {

    private static final Map<String, String> SORT_FIELD_ALIASES = Map.of(
            "id", "id",
            "name", "name",
            "city", "city",
            "location", "city",
            "starRating", "starRating",
            "rating", "starRating"
    );

    private final HotelRepository hotelRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final AvailabilityService availabilityService;

    public HotelService(
            HotelRepository hotelRepository,
            RoomTypeRepository roomTypeRepository,
            AvailabilityService availabilityService
    ) {
        this.hotelRepository = hotelRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.availabilityService = availabilityService;
    }

    public PageResponse<HotelSummaryResponse> searchHotels(
            String city,
            LocalDate checkIn,
            LocalDate checkOut,
            int guests,
            int page,
            int size,
            String sortBy,
            String direction
    ) {
        if (guests < 1) {
            throw new BadRequestException("Guest count must be at least 1");
        }
        boolean hasDates = checkIn != null || checkOut != null;
        if (hasDates) {
            availabilityService.validateDateRange(checkIn, checkOut);
        }

        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 50);
        String safeSort = SORT_FIELD_ALIASES.getOrDefault(sortBy, "starRating");
        Sort.Direction sortDir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(sortDir, safeSort).and(Sort.by("id")));

        String normalizedLocation = city == null ? null : city.trim();
        Page<Hotel> hotelPage = hotelRepository.searchByLocation(normalizedLocation, pageable);

        List<Long> hotelIds = hotelPage.getContent().stream().map(Hotel::getId).toList();
        Map<Long, List<RoomType>> roomsByHotel = hotelIds.isEmpty()
                ? Collections.emptyMap()
                : roomTypeRepository.findByHotelIdIn(hotelIds).stream()
                        .collect(Collectors.groupingBy(rt -> rt.getHotel().getId()));

        List<Long> allRoomTypeIds = roomsByHotel.values().stream()
                .flatMap(List::stream)
                .map(RoomType::getId)
                .toList();

        Map<Long, Integer> bookedCounts = hasDates
                ? availabilityService.getBookedCountsByRoomType(allRoomTypeIds, checkIn, checkOut)
                : Collections.emptyMap();

        Page<HotelSummaryResponse> mapped = hotelPage.map(hotel -> toSummary(
                hotel,
                roomsByHotel.getOrDefault(hotel.getId(), Collections.emptyList()),
                guests,
                hasDates,
                bookedCounts
        ));
        return PageResponse.from(mapped);
    }

    public HotelDetailResponse getHotelById(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + hotelId));
        return new HotelDetailResponse(
                hotel.getId(),
                hotel.getName(),
                hotel.getCity(),
                hotel.getCountry(),
                hotel.getAddress(),
                hotel.getDescription(),
                hotel.getStarRating(),
                parseAmenities(hotel.getAmenities()),
                hotel.getImageUrl()
        );
    }

    public List<String> getAvailableCities() {
        return hotelRepository.findDistinctCities();
    }

    private HotelSummaryResponse toSummary(
            Hotel hotel,
            List<RoomType> roomTypes,
            int guests,
            boolean hasDates,
            Map<Long, Integer> bookedCounts
    ) {
        List<RoomType> fittingRooms = roomTypes.stream()
                .filter(rt -> rt.getMaxGuests() >= guests)
                .toList();

        List<RoomType> pricePool = fittingRooms.isEmpty() ? roomTypes : fittingRooms;
        RoomType cheapest = pricePool.stream()
                .min(Comparator.comparing(RoomType::getBasePricePerNight))
                .orElse(null);

        BigDecimal startingPrice = cheapest != null ? cheapest.getBasePricePerNight() : BigDecimal.ZERO;
        String currency = cheapest != null ? cheapest.getCurrency() : "INR";

        Integer totalAvailableRooms = null;
        if (hasDates) {
            int sum = 0;
            for (RoomType rt : fittingRooms) {
                int booked = bookedCounts.getOrDefault(rt.getId(), 0);
                sum += Math.max(0, rt.getTotalRooms() - booked);
            }
            totalAvailableRooms = sum;
        }

        return new HotelSummaryResponse(
                hotel.getId(),
                hotel.getName(),
                hotel.getCity(),
                hotel.getCountry(),
                hotel.getAddress(),
                hotel.getDescription(),
                hotel.getStarRating(),
                parseAmenities(hotel.getAmenities()),
                hotel.getImageUrl(),
                startingPrice,
                currency,
                fittingRooms.size(),
                totalAvailableRooms
        );
    }

    public static List<String> parseAmenities(String amenitiesCsv) {
        if (amenitiesCsv == null || amenitiesCsv.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.stream(amenitiesCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}

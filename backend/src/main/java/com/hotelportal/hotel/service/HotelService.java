package com.hotelportal.hotel.service;

import com.hotelportal.availability.service.AvailabilityService;
import com.hotelportal.common.dto.PageResponse;
import com.hotelportal.common.exception.BadRequestException;
import com.hotelportal.common.exception.ResourceNotFoundException;
import com.hotelportal.hotel.dto.HotelDetailResponse;
import com.hotelportal.hotel.dto.HotelFilterMetadataResponse;
import com.hotelportal.hotel.dto.HotelSummaryResponse;
import com.hotelportal.hotel.entity.Hotel;
import com.hotelportal.hotel.repository.HotelRepository;
import com.hotelportal.room.entity.RoomType;
import com.hotelportal.room.repository.RoomTypeRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeSet;
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
        return searchHotels(city, checkIn, checkOut, guests, null, null, null, null, page, size, sortBy, direction);
    }

    public PageResponse<HotelSummaryResponse> searchHotels(
            String city,
            LocalDate checkIn,
            LocalDate checkOut,
            int guests,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minRating,
            List<String> amenities,
            int page,
            int size,
            String sortBy,
            String direction
    ) {
        if (guests < 1) {
            throw new BadRequestException("Guest count must be at least 1");
        }
        if (minPrice != null && minPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Minimum price cannot be negative");
        }
        if (maxPrice != null && maxPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Maximum price cannot be negative");
        }
        if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
            throw new BadRequestException("Minimum price cannot exceed maximum price");
        }
        if (minRating != null && (minRating < 1 || minRating > 5)) {
            throw new BadRequestException("Minimum rating must be between 1 and 5");
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

        String normalizedLocation = city == null || city.isBlank() ? null : city.trim();
        List<String> normalizedAmenities = normalizeAmenities(amenities);

        Specification<Hotel> spec = buildSearchSpecification(
                normalizedLocation,
                guests,
                minPrice,
                maxPrice,
                minRating,
                normalizedAmenities
        );

        Page<Hotel> hotelPage = hotelRepository.findAll(spec, pageable);

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
                minPrice,
                maxPrice,
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

    public HotelFilterMetadataResponse getFilterMetadata() {
        BigDecimal minPrice = roomTypeRepository.findMinBasePricePerNight();
        BigDecimal maxPrice = roomTypeRepository.findMaxBasePricePerNight();
        TreeSet<String> distinctAmenities = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        for (String csv : hotelRepository.findAllAmenityCsvs()) {
            distinctAmenities.addAll(parseAmenities(csv));
        }
        return new HotelFilterMetadataResponse(
                minPrice != null ? minPrice : BigDecimal.ZERO,
                maxPrice != null ? maxPrice : BigDecimal.ZERO,
                "INR",
                List.copyOf(distinctAmenities)
        );
    }

    private Specification<Hotel> buildSearchSpecification(
            String location,
            int guests,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Integer minRating,
            List<String> amenities
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (location != null) {
                String pattern = "%" + location.toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("city")), pattern),
                        cb.like(cb.lower(root.get("address")), pattern),
                        cb.like(cb.lower(root.get("country")), pattern)
                ));
            }

            if (minRating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("starRating"), minRating));
            }

            for (String amenity : amenities) {
                String pattern = "%" + amenity.toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.like(cb.lower(root.get("amenities")), pattern));
            }

            if (minPrice != null || maxPrice != null) {
                Subquery<Long> roomSubquery = query.subquery(Long.class);
                Root<RoomType> roomRoot = roomSubquery.from(RoomType.class);

                List<Predicate> roomPreds = new ArrayList<>();
                roomPreds.add(cb.equal(roomRoot.get("hotel"), root));
                roomPreds.add(cb.greaterThanOrEqualTo(roomRoot.get("maxGuests"), guests));
                if (minPrice != null) {
                    roomPreds.add(cb.greaterThanOrEqualTo(roomRoot.get("basePricePerNight"), minPrice));
                }
                if (maxPrice != null) {
                    roomPreds.add(cb.lessThanOrEqualTo(roomRoot.get("basePricePerNight"), maxPrice));
                }

                roomSubquery.select(cb.literal(1L)).where(roomPreds.toArray(Predicate[]::new));
                predicates.add(cb.exists(roomSubquery));
            }

            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private List<String> normalizeAmenities(List<String> rawAmenities) {
        if (rawAmenities == null || rawAmenities.isEmpty()) {
            return Collections.emptyList();
        }
        return rawAmenities.stream()
                .filter(s -> s != null && !s.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
    }

    private HotelSummaryResponse toSummary(
            Hotel hotel,
            List<RoomType> roomTypes,
            int guests,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            boolean hasDates,
            Map<Long, Integer> bookedCounts
    ) {
        boolean hasPriceFilter = minPrice != null || maxPrice != null;

        List<RoomType> fittingRooms = roomTypes.stream()
                .filter(rt -> rt.getMaxGuests() >= guests)
                .filter(rt -> minPrice == null || rt.getBasePricePerNight().compareTo(minPrice) >= 0)
                .filter(rt -> maxPrice == null || rt.getBasePricePerNight().compareTo(maxPrice) <= 0)
                .toList();

        List<RoomType> pricePool = (!fittingRooms.isEmpty() || hasPriceFilter) ? fittingRooms : roomTypes;
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

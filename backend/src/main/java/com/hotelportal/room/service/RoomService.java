package com.hotelportal.room.service;

import com.hotelportal.availability.dto.AlternativeDateSuggestion;
import com.hotelportal.availability.dto.HotelAvailabilityResponse;
import com.hotelportal.availability.service.AvailabilityService;
import com.hotelportal.common.exception.BadRequestException;
import com.hotelportal.common.exception.ResourceNotFoundException;
import com.hotelportal.hotel.entity.Hotel;
import com.hotelportal.hotel.repository.HotelRepository;
import com.hotelportal.hotel.service.HotelService;
import com.hotelportal.pricing.dto.PriceBreakdown;
import com.hotelportal.pricing.service.PricingService;
import com.hotelportal.room.dto.RoomTypeResponse;
import com.hotelportal.room.entity.RoomType;
import com.hotelportal.room.repository.RoomTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class RoomService {

    private final HotelRepository hotelRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final AvailabilityService availabilityService;
    private final PricingService pricingService;

    public RoomService(
            HotelRepository hotelRepository,
            RoomTypeRepository roomTypeRepository,
            AvailabilityService availabilityService,
            PricingService pricingService
    ) {
        this.hotelRepository = hotelRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.availabilityService = availabilityService;
        this.pricingService = pricingService;
    }

    public List<RoomTypeResponse> getRoomsByHotel(Long hotelId, LocalDate checkIn, LocalDate checkOut, int guests) {
        if (guests < 1) {
            throw new BadRequestException("Guest count must be at least 1");
        }
        if (!hotelRepository.existsById(hotelId)) {
            throw new ResourceNotFoundException("Hotel not found with id: " + hotelId);
        }

        boolean hasDates = checkIn != null || checkOut != null;
        if (hasDates) {
            availabilityService.validateDateRange(checkIn, checkOut);
        }

        List<RoomType> roomTypes = roomTypeRepository.findByHotelIdOrderByBasePricePerNightAsc(hotelId);
        List<Long> roomTypeIds = roomTypes.stream().map(RoomType::getId).toList();
        Map<Long, Integer> bookedCounts = hasDates
                ? availabilityService.getBookedCountsByRoomType(roomTypeIds, checkIn, checkOut)
                : Collections.emptyMap();

        List<RoomType> soldOutEligibleTypes = new ArrayList<>();
        if (hasDates) {
            for (RoomType rt : roomTypes) {
                int booked = bookedCounts.getOrDefault(rt.getId(), 0);
                int avail = Math.max(0, rt.getTotalRooms() - booked);
                if (avail == 0 && guests <= rt.getMaxGuests()) {
                    soldOutEligibleTypes.add(rt);
                }
            }
        }

        Map<Long, List<AlternativeDateSuggestion>> alternativesByRoom = hasDates && !soldOutEligibleTypes.isEmpty()
                ? availabilityService.findAlternativeDateRanges(soldOutEligibleTypes, checkIn, checkOut, guests)
                : Collections.emptyMap();

        return mapRoomResponses(hotelId, roomTypes, hasDates, checkIn, checkOut, guests, bookedCounts, alternativesByRoom);
    }

    public HotelAvailabilityResponse getHotelAvailability(Long hotelId, LocalDate checkIn, LocalDate checkOut, int guests) {
        if (guests < 1) {
            throw new BadRequestException("Guest count must be at least 1");
        }
        availabilityService.validateDateRange(checkIn, checkOut);

        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResourceNotFoundException("Hotel not found with id: " + hotelId));

        List<RoomType> roomTypes = roomTypeRepository.findByHotelIdOrderByBasePricePerNightAsc(hotelId);
        List<Long> roomTypeIds = roomTypes.stream().map(RoomType::getId).toList();
        Map<Long, Integer> bookedCounts = availabilityService.getBookedCountsByRoomType(roomTypeIds, checkIn, checkOut);

        List<RoomType> soldOutEligibleTypes = new ArrayList<>();
        int totalAvailableRooms = 0;
        for (RoomType rt : roomTypes) {
            int booked = bookedCounts.getOrDefault(rt.getId(), 0);
            int avail = Math.max(0, rt.getTotalRooms() - booked);
            if (guests <= rt.getMaxGuests()) {
                totalAvailableRooms += avail;
                if (avail == 0) {
                    soldOutEligibleTypes.add(rt);
                }
            }
        }

        Map<Long, List<AlternativeDateSuggestion>> alternativesByRoom = !soldOutEligibleTypes.isEmpty()
                ? availabilityService.findAlternativeDateRanges(soldOutEligibleTypes, checkIn, checkOut, guests)
                : Collections.emptyMap();

        List<RoomTypeResponse> rooms = mapRoomResponses(
                hotelId, roomTypes, true, checkIn, checkOut, guests, bookedCounts, alternativesByRoom
        );
        int nights = Math.toIntExact(ChronoUnit.DAYS.between(checkIn, checkOut));

        return new HotelAvailabilityResponse(
                hotel.getId(),
                hotel.getName(),
                hotel.getCity(),
                checkIn,
                checkOut,
                nights,
                guests,
                totalAvailableRooms,
                rooms
        );
    }

    private List<RoomTypeResponse> mapRoomResponses(
            Long hotelId,
            List<RoomType> roomTypes,
            boolean hasDates,
            LocalDate checkIn,
            LocalDate checkOut,
            int guests,
            Map<Long, Integer> bookedCounts,
            Map<Long, List<AlternativeDateSuggestion>> alternativesByRoom
    ) {
        return roomTypes.stream()
                .map(rt -> {
                    Integer availableRooms = null;
                    PriceBreakdown priceBreakdown = null;
                    List<AlternativeDateSuggestion> alternatives = Collections.emptyList();
                    if (hasDates) {
                        int booked = bookedCounts.getOrDefault(rt.getId(), 0);
                        availableRooms = Math.max(0, rt.getTotalRooms() - booked);
                        priceBreakdown = pricingService.calculatePrice(
                                rt.getBasePricePerNight(),
                                rt.getCurrency(),
                                checkIn,
                                checkOut
                        );
                        alternatives = alternativesByRoom.getOrDefault(rt.getId(), Collections.emptyList());
                    }
                    return new RoomTypeResponse(
                            rt.getId(),
                            hotelId,
                            rt.getName(),
                            rt.getDescription(),
                            rt.getBasePricePerNight(),
                            rt.getCurrency(),
                            rt.getMaxGuests(),
                            rt.getTotalRooms(),
                            availableRooms,
                            guests <= rt.getMaxGuests(),
                            HotelService.parseAmenities(rt.getAmenities()),
                            priceBreakdown,
                            alternatives
                    );
                })
                .toList();
    }
}

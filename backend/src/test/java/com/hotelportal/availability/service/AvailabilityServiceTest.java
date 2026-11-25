package com.hotelportal.availability.service;

import com.hotelportal.availability.dto.AlternativeDateSuggestion;
import com.hotelportal.availability.dto.AvailabilityResponse;
import com.hotelportal.booking.entity.Booking;
import com.hotelportal.booking.entity.BookingStatus;
import com.hotelportal.booking.repository.BookingRepository;
import com.hotelportal.common.exception.InvalidDateRangeException;
import com.hotelportal.hotel.entity.Hotel;
import com.hotelportal.pricing.service.PricingService;
import com.hotelportal.room.entity.RoomType;
import com.hotelportal.room.repository.RoomTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AvailabilityServiceTest {

    @Mock
    private RoomTypeRepository roomTypeRepository;

    @Mock
    private BookingRepository bookingRepository;

    private AvailabilityService availabilityService;

    @BeforeEach
    void setUp() {
        PricingService pricingService = new PricingService(new BigDecimal("0.12"));
        availabilityService = new AvailabilityService(roomTypeRepository, bookingRepository, pricingService, 30);
    }

    @Test
    void rejectsPastCheckInOrInvalidOrderOrExcessiveStay() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        assertThatThrownBy(() -> availabilityService.validateDateRange(null, tomorrow))
                .isInstanceOf(InvalidDateRangeException.class);
        assertThatThrownBy(() -> availabilityService.validateDateRange(yesterday, tomorrow))
                .isInstanceOf(InvalidDateRangeException.class);
        assertThatThrownBy(() -> availabilityService.validateDateRange(tomorrow, tomorrow))
                .isInstanceOf(InvalidDateRangeException.class);
        assertThatThrownBy(() -> availabilityService.validateDateRange(tomorrow, tomorrow.plusDays(31)))
                .isInstanceOf(InvalidDateRangeException.class);
    }

    @Test
    void computesAvailableRoomsAndCapacitySupport() {
        Hotel hotel = new Hotel();
        hotel.setName("Test Hotel");
        RoomType roomType = new RoomType();
        roomType.setHotel(hotel);
        roomType.setName("Deluxe Room");
        roomType.setBasePricePerNight(new BigDecimal("200.00"));
        roomType.setCurrency("USD");
        roomType.setMaxGuests(2);
        roomType.setTotalRooms(4);

        LocalDate checkIn = LocalDate.now().plusDays(3);
        LocalDate checkOut = checkIn.plusDays(2);

        when(roomTypeRepository.findByIdWithHotel(1L)).thenReturn(Optional.of(roomType));
        when(bookingRepository.countOverlappingBookings(1L, BookingStatus.CONFIRMED, checkIn, checkOut)).thenReturn(3L);

        AvailabilityResponse response = availabilityService.checkRoomAvailability(1L, checkIn, checkOut, 2);
        assertThat(response.totalRooms()).isEqualTo(4);
        assertThat(response.bookedRooms()).isEqualTo(3);
        assertThat(response.availableRooms()).isEqualTo(1);
        assertThat(response.available()).isTrue();
        assertThat(response.capacitySupported()).isTrue();
        assertThat(response.priceBreakdown().totalAmount()).isEqualByComparingTo("448.00");

        AvailabilityResponse overCapacity = availabilityService.checkRoomAvailability(1L, checkIn, checkOut, 3);
        assertThat(overCapacity.capacitySupported()).isFalse();
        assertThat(overCapacity.available()).isFalse();
    }

    @Test
    void suggestsUpToThreeAlternativeDateRangesWithinSevenDaysPreservingNights() {
        Hotel hotel = new Hotel();
        RoomType roomType = new RoomType();
        ReflectionTestUtils.setField(roomType, "id", 10L);
        roomType.setHotel(hotel);
        roomType.setName("Presidential Suite");
        roomType.setBasePricePerNight(new BigDecimal("400.00"));
        roomType.setCurrency("USD");
        roomType.setMaxGuests(4);
        roomType.setTotalRooms(1);

        LocalDate checkIn = LocalDate.now().plusDays(5);
        LocalDate checkOut = checkIn.plusDays(2); // 2-night stay

        Booking blockingStay = new Booking();
        blockingStay.setRoomType(roomType);
        blockingStay.setStatus(BookingStatus.CONFIRMED);
        blockingStay.setCheckInDate(checkIn);
        blockingStay.setCheckOutDate(checkIn.plusDays(2)); // blocks offset +1 as well ([checkIn+1, checkIn+3) overlaps [checkIn, checkIn+2))

        when(roomTypeRepository.findByIdWithHotel(10L)).thenReturn(Optional.of(roomType));
        when(bookingRepository.findOverlappingBookingsInWindow(
                List.of(10L),
                BookingStatus.CONFIRMED,
                checkIn.plusDays(1),
                checkIn.plusDays(9)
        )).thenReturn(List.of(blockingStay));

        List<AlternativeDateSuggestion> suggestions = availabilityService.getAlternativeDateSuggestions(10L, checkIn, checkOut, 2);

        assertThat(suggestions).hasSize(3);
        // Earliest available 2-night window starts at checkIn + 2 (back-to-back with blockingStay)
        assertThat(suggestions.get(0).checkInDate()).isEqualTo(checkIn.plusDays(2));
        assertThat(suggestions.get(0).checkOutDate()).isEqualTo(checkIn.plusDays(4));
        assertThat(suggestions.get(0).nights()).isEqualTo(2);
        assertThat(suggestions.get(1).checkInDate()).isEqualTo(checkIn.plusDays(3));
        assertThat(suggestions.get(2).checkInDate()).isEqualTo(checkIn.plusDays(4));

        // Returns empty when guest capacity exceeded
        assertThat(availabilityService.getAlternativeDateSuggestions(10L, checkIn, checkOut, 5)).isEmpty();
    }

    @Test
    void returnsEmptyAlternativesWhenEntireNextWeekIsBooked() {
        RoomType roomType = new RoomType();
        ReflectionTestUtils.setField(roomType, "id", 11L);
        roomType.setBasePricePerNight(new BigDecimal("150.00"));
        roomType.setCurrency("USD");
        roomType.setMaxGuests(2);
        roomType.setTotalRooms(1);

        LocalDate checkIn = LocalDate.now().plusDays(5);
        LocalDate checkOut = checkIn.plusDays(2);

        Booking longStay = new Booking();
        longStay.setRoomType(roomType);
        longStay.setStatus(BookingStatus.CONFIRMED);
        longStay.setCheckInDate(checkIn);
        longStay.setCheckOutDate(checkIn.plusDays(10));

        when(roomTypeRepository.findByIdWithHotel(11L)).thenReturn(Optional.of(roomType));
        when(bookingRepository.findOverlappingBookingsInWindow(
                List.of(11L),
                BookingStatus.CONFIRMED,
                checkIn.plusDays(1),
                checkIn.plusDays(9)
        )).thenReturn(Collections.singletonList(longStay));

        assertThat(availabilityService.getAlternativeDateSuggestions(11L, checkIn, checkOut, 2)).isEmpty();
    }
}

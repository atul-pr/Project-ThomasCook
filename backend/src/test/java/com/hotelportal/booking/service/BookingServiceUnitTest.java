package com.hotelportal.booking.service;

import com.hotelportal.availability.service.AvailabilityService;
import com.hotelportal.booking.dto.BookingResponse;
import com.hotelportal.booking.dto.CancelBookingRequest;
import com.hotelportal.booking.dto.CreateBookingRequest;
import com.hotelportal.booking.entity.Booking;
import com.hotelportal.booking.entity.BookingStatus;
import com.hotelportal.booking.repository.BookingRepository;
import com.hotelportal.common.exception.BadRequestException;
import com.hotelportal.common.exception.BookingConflictException;
import com.hotelportal.common.exception.RoomUnavailableException;
import com.hotelportal.hotel.entity.Hotel;
import com.hotelportal.pricing.service.PricingService;
import com.hotelportal.room.entity.RoomType;
import com.hotelportal.room.repository.RoomTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceUnitTest {

    @Mock
    private RoomTypeRepository roomTypeRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private BookingReferenceGenerator referenceGenerator;

    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        PricingService pricingService = new PricingService(new BigDecimal("0.12"));
        AvailabilityService availabilityService = new AvailabilityService(
                roomTypeRepository, bookingRepository, pricingService, 30
        );
        bookingService = new BookingService(
                roomTypeRepository, bookingRepository, availabilityService, pricingService, referenceGenerator
        );
    }

    @Test
    void createBookingAcquiresPessimisticLockAndStoresPriceSnapshot() {
        Hotel hotel = new Hotel();
        hotel.setName("Mumbai Palace");
        hotel.setCity("Mumbai");

        RoomType roomType = new RoomType();
        roomType.setHotel(hotel);
        roomType.setName("Sea View Suite");
        roomType.setBasePricePerNight(new BigDecimal("300.00"));
        roomType.setCurrency("USD");
        roomType.setMaxGuests(3);
        roomType.setTotalRooms(2);

        LocalDate checkIn = LocalDate.now().plusDays(4);
        LocalDate checkOut = checkIn.plusDays(2);

        when(roomTypeRepository.findByIdWithHotelForUpdate(2L)).thenReturn(Optional.of(roomType));
        when(bookingRepository.countOverlappingBookings(any(), any(), any(), any())).thenReturn(1L);
        when(referenceGenerator.generate()).thenReturn("HTL-ABC12345");
        when(bookingRepository.existsByBookingReference("HTL-ABC12345")).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateBookingRequest request = new CreateBookingRequest(
                2L, "Atul Prajapati", "Atul@Example.com", "+91-9999999999",
                checkIn, checkOut, 2, "High floor"
        );

        BookingResponse response = bookingService.createBooking(request);

        verify(roomTypeRepository).findByIdWithHotelForUpdate(2L);
        assertThat(response.bookingReference()).isEqualTo("HTL-ABC12345");
        assertThat(response.status()).isEqualTo(BookingStatus.CONFIRMED);
        assertThat(response.guestEmail()).isEqualTo("atul@example.com");
        assertThat(response.nights()).isEqualTo(2);
        assertThat(response.pricePerNightSnapshot()).isEqualByComparingTo("300.00");
        assertThat(response.taxAmountSnapshot()).isEqualByComparingTo("72.00");
        assertThat(response.totalAmountSnapshot()).isEqualByComparingTo("672.00");
    }

    @Test
    void createBookingRejectsWhenCapacityExceededOrNoRoomsAvailable() {
        Hotel hotel = new Hotel();
        RoomType roomType = new RoomType();
        roomType.setHotel(hotel);
        roomType.setName("Deluxe");
        roomType.setBasePricePerNight(new BigDecimal("100.00"));
        roomType.setMaxGuests(2);
        roomType.setTotalRooms(1);

        LocalDate checkIn = LocalDate.now().plusDays(2);
        LocalDate checkOut = checkIn.plusDays(1);

        when(roomTypeRepository.findByIdWithHotelForUpdate(1L)).thenReturn(Optional.of(roomType));

        CreateBookingRequest tooManyGuests = new CreateBookingRequest(
                1L, "Guest", "guest@example.com", null, checkIn, checkOut, 4, null
        );
        assertThatThrownBy(() -> bookingService.createBooking(tooManyGuests))
                .isInstanceOf(BadRequestException.class);

        when(bookingRepository.countOverlappingBookings(any(), any(), any(), any())).thenReturn(1L);
        CreateBookingRequest validGuests = new CreateBookingRequest(
                1L, "Guest", "guest@example.com", null, checkIn, checkOut, 2, null
        );
        assertThatThrownBy(() -> bookingService.createBooking(validGuests))
                .isInstanceOf(RoomUnavailableException.class);
    }

    @Test
    void cancelBookingRejectsAlreadyCancelledBooking() {
        Hotel hotel = new Hotel();
        RoomType roomType = new RoomType();
        Booking existing = new Booking();
        existing.setBookingReference("HTL-11112222");
        existing.setHotel(hotel);
        existing.setRoomType(roomType);
        existing.setGuestEmail("guest@example.com");
        existing.setStatus(BookingStatus.CANCELLED);

        when(bookingRepository.findByReferenceAndEmailForUpdate("HTL-11112222", "guest@example.com"))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> bookingService.cancelBooking("htl-11112222", new CancelBookingRequest("GUEST@example.com")))
                .isInstanceOf(BookingConflictException.class);
    }
}

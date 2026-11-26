package com.hotelportal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelportal.booking.dto.CreateBookingRequest;
import com.hotelportal.booking.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class HotelAndAvailabilityApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookingRepository bookingRepository;

    @BeforeEach
    void cleanBookings() {
        bookingRepository.deleteAll();
    }

    @Test
    void listsHotelsWithPaginationLocationSearchAndSorting() throws Exception {
        mockMvc.perform(get("/api/hotels"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.size").value(10))
                .andExpect(jsonPath("$.content[0].location").isNotEmpty())
                .andExpect(jsonPath("$.content[0].rating").isNumber());

        mockMvc.perform(get("/api/hotels")
                        .param("location", "Mumbai")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].name").value("The Taj Mahal Palace View"))
                .andExpect(jsonPath("$.content[0].location").value("Mumbai"))
                .andExpect(jsonPath("$.content[0].currency").value("INR"));

        mockMvc.perform(get("/api/hotels")
                        .param("sort", "name,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Amber Haveli Jaipur"));
    }

    @Test
    void returnsHotelDetailsAndRejectsInvalidHotelIdWithConsistentError() throws Exception {
        mockMvc.perform(get("/api/hotels/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.location").value("Mumbai"))
                .andExpect(jsonPath("$.rating").value(5));

        mockMvc.perform(get("/api/hotels/9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error").value("Not Found"))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.path").value("/api/hotels/9999"));
    }

    @Test
    void validatesDatesAndRejectsInvalidHotelOnHotelAvailabilityEndpoint() throws Exception {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        // Past check-in
        mockMvc.perform(get("/api/hotels/1/availability")
                        .param("checkIn", yesterday.toString())
                        .param("checkOut", tomorrow.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        // Check-out equal to check-in
        mockMvc.perform(get("/api/hotels/1/availability")
                        .param("checkIn", tomorrow.toString())
                        .param("checkOut", tomorrow.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        // Check-out before check-in
        mockMvc.perform(get("/api/hotels/1/availability")
                        .param("checkIn", tomorrow.plusDays(2).toString())
                        .param("checkOut", tomorrow.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        // Non-existent hotel ID
        mockMvc.perform(get("/api/hotels/9999/availability")
                        .param("checkIn", tomorrow.toString())
                        .param("checkOut", tomorrow.plusDays(2).toString()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void computesHotelAvailabilityWithOverlapAndBackToBackRules() throws Exception {
        LocalDate checkIn = LocalDate.now().plusDays(7);
        LocalDate checkOut = checkIn.plusDays(3);

        // Initially hotel 1 has 4 + 2 + 1 = 7 available rooms for 2 guests (Presidential has maxGuests=5, Deluxe=2, SeaView=3)
        mockMvc.perform(get("/api/hotels/1/availability")
                        .param("checkIn", checkIn.toString())
                        .param("checkOut", checkOut.toString())
                        .param("guests", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hotelId").value(1))
                .andExpect(jsonPath("$.nights").value(3))
                .andExpect(jsonPath("$.totalAvailableRooms").value(7))
                .andExpect(jsonPath("$.rooms.length()").value(3));

        // Reserve the single Presidential Family Suite (id=3) for [checkIn, checkOut)
        CreateBookingRequest booking = new CreateBookingRequest(
                3L, "Rohan Verma", "rohan@example.com", null, checkIn, checkOut, 2, null
        );
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(booking)))
                .andExpect(status().isCreated());

        // Overlapping window [checkIn+1, checkOut+1) sees Presidential Suite at 0 available rooms
        mockMvc.perform(get("/api/hotels/1/availability")
                        .param("checkIn", checkIn.plusDays(1).toString())
                        .param("checkOut", checkOut.plusDays(1).toString())
                        .param("guests", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAvailableRooms").value(6))
                .andExpect(jsonPath("$.rooms[2].id").value(3))
                .andExpect(jsonPath("$.rooms[2].availableRooms").value(0));

        // Back-to-back window starting at checkOut still sees Presidential Suite available (1 room)
        mockMvc.perform(get("/api/hotels/1/availability")
                        .param("checkIn", checkOut.toString())
                        .param("checkOut", checkOut.plusDays(2).toString())
                        .param("guests", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAvailableRooms").value(7))
                .andExpect(jsonPath("$.rooms[2].id").value(3))
                .andExpect(jsonPath("$.rooms[2].availableRooms").value(1));
    }
}

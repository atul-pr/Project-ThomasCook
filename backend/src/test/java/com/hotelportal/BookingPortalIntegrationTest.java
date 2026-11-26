package com.hotelportal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotelportal.booking.dto.BookingResponse;
import com.hotelportal.booking.dto.CreateBookingRequest;
import com.hotelportal.booking.entity.BookingStatus;
import com.hotelportal.booking.repository.BookingRepository;
import com.hotelportal.booking.service.BookingService;
import com.hotelportal.common.exception.RoomUnavailableException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class BookingPortalIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @BeforeEach
    void cleanBookings() {
        bookingRepository.deleteAll();
    }

    @Test
    void searchHotelsSupportsLocationFilterPaginationAndDateValidation() throws Exception {
        mockMvc.perform(get("/api/v1/hotels")
                        .param("page", "0")
                        .param("size", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.content.length()").value(2));

        mockMvc.perform(get("/api/v1/hotels")
                        .param("city", "Mumbai"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].city").value("Mumbai"));

        LocalDate today = LocalDate.now();
        mockMvc.perform(get("/api/v1/hotels")
                        .param("checkIn", today.plusDays(3).toString())
                        .param("checkOut", today.plusDays(3).toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void fullBookingLifecycleBackToBackAndCancellationRelease() throws Exception {
        LocalDate checkIn = LocalDate.now().plusDays(10);
        LocalDate checkOut = checkIn.plusDays(2);

        // RoomType 3 is Presidential Family Suite (totalRooms = 1, price = 32000.00 INR/night)
        CreateBookingRequest firstRequest = new CreateBookingRequest(
                3L, "Aarav Mehta", "aarav@example.com", "+91-9876543210",
                checkIn, checkOut, 4, "Late check-in"
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookingReference").isNotEmpty())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.nights").value(2))
                .andExpect(jsonPath("$.currency").value("INR"))
                .andExpect(jsonPath("$.totalAmountSnapshot").value(71680.00))
                .andReturn();

        JsonNode createdJson = objectMapper.readTree(createResult.getResponse().getContentAsString());
        String bookingRef = createdJson.get("bookingReference").asText();

        // Overlapping stay must fail with 409 Conflict
        CreateBookingRequest overlappingRequest = new CreateBookingRequest(
                3L, "Priya Sharma", "priya@example.com", null,
                checkIn.plusDays(1), checkOut.plusDays(1), 2, null
        );
        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(overlappingRequest)))
                .andExpect(status().isConflict());

        // Back-to-back stay (checkIn2 == checkOut1) MUST succeed
        CreateBookingRequest backToBackRequest = new CreateBookingRequest(
                3L, "Priya Sharma", "priya@example.com", null,
                checkOut, checkOut.plusDays(2), 2, null
        );
        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(backToBackRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        // Lookup by reference + email (case-insensitive)
        mockMvc.perform(get("/api/v1/bookings/lookup")
                        .param("reference", bookingRef)
                        .param("email", "AARAV@EXAMPLE.COM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingReference").value(bookingRef))
                .andExpect(jsonPath("$.guestName").value("Aarav Mehta"));

        // Wrong email returns 404
        mockMvc.perform(get("/api/v1/bookings/lookup")
                        .param("reference", bookingRef)
                        .param("email", "wrong@example.com"))
                .andExpect(status().isNotFound());

        // Cancel first booking -> releases availability
        mockMvc.perform(post("/api/v1/bookings/" + bookingRef + "/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"aarav@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.cancelledAt").isNotEmpty());

        // Now a booking for the exact same original dates succeeds
        CreateBookingRequest rebookRequest = new CreateBookingRequest(
                3L, "Vikram Singh", "vikram@example.com", null,
                checkIn, checkOut, 2, null
        );
        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rebookRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    void concurrentBookingsRespectRoomCapacityUnderPessimisticLock() throws Exception {
        // RoomType 2 is Sea View Suite with totalRooms = 2
        long roomTypeId = 2L;
        LocalDate checkIn = LocalDate.now().plusDays(20);
        LocalDate checkOut = checkIn.plusDays(2);

        int threads = 8;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch readyLatch = new CountDownLatch(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger unavailableCount = new AtomicInteger(0);
        List<Throwable> unexpectedErrors = Collections.synchronizedList(new ArrayList<>());

        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            final int idx = i;
            futures.add(executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    BookingResponse response = bookingService.createBooking(new CreateBookingRequest(
                            roomTypeId,
                            "Concurrent Guest " + idx,
                            "guest" + idx + "@example.com",
                            null,
                            checkIn,
                            checkOut,
                            2,
                            null
                    ));
                    if (response.status() == BookingStatus.CONFIRMED) {
                        successCount.incrementAndGet();
                    }
                } catch (RoomUnavailableException ex) {
                    unavailableCount.incrementAndGet();
                } catch (Throwable ex) {
                    unexpectedErrors.add(ex);
                }
            }));
        }

        assertThat(readyLatch.await(5, TimeUnit.SECONDS)).isTrue();
        startLatch.countDown();
        for (Future<?> future : futures) {
            future.get(15, TimeUnit.SECONDS);
        }
        executor.shutdown();

        assertThat(unexpectedErrors).isEmpty();
        assertThat(successCount.get()).isEqualTo(2);
        assertThat(unavailableCount.get()).isEqualTo(6);

        long persistedConfirmed = bookingRepository.countOverlappingBookings(
                roomTypeId, BookingStatus.CONFIRMED, checkIn, checkOut
        );
        assertThat(persistedConfirmed).isEqualTo(2L);
    }

    @Test
    void roomEndpointIncludesSmartAlternativeDatesWhenRoomTypeIsSoldOut() throws Exception {
        LocalDate checkIn = LocalDate.now().plusDays(15);
        LocalDate checkOut = checkIn.plusDays(2);

        // Book out RoomType 3 (totalRooms = 1)
        CreateBookingRequest request = new CreateBookingRequest(
                3L, "Meera Nair", "meera@example.com", null,
                checkIn, checkOut, 2, null
        );
        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Hotel 1 rooms should now show roomTypeId=3 with 0 availableRooms and 3 alternative dates starting at checkOut
        mockMvc.perform(get("/api/v1/hotels/1/rooms")
                        .param("checkIn", checkIn.toString())
                        .param("checkOut", checkOut.toString())
                        .param("guests", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[2].id").value(3))
                .andExpect(jsonPath("$[2].availableRooms").value(0))
                .andExpect(jsonPath("$[2].alternativeDates.length()").value(3))
                .andExpect(jsonPath("$[2].alternativeDates[0].checkInDate").value(checkOut.toString()))
                .andExpect(jsonPath("$[2].alternativeDates[0].checkOutDate").value(checkOut.plusDays(2).toString()))
                .andExpect(jsonPath("$[2].alternativeDates[0].nights").value(2));
    }
}

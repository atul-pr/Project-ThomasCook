package com.hotelportal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class BookingEngineIntegrationTest {

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
    void successfulBookingOneNightAndMultipleNightsCalculateCorrectTotalInInr() throws Exception {
        LocalDate checkIn = LocalDate.now().plusDays(4);

        // 1-night stay on RoomType 1 (Deluxe City Room, INR 11,500.00/night -> + 12% GST = 12,880.00)
        String oneNightBody = """
                {
                  "hotelId": 1,
                  "roomTypeId": 1,
                  "guestName": "Atul Prajapati",
                  "guestEmail": "atul@example.com",
                  "checkIn": "%s",
                  "checkOut": "%s"
                }
                """.formatted(checkIn, checkIn.plusDays(1));

        MvcResult oneNightResult = mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(oneNightBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bookingReference").isNotEmpty())
                .andExpect(jsonPath("$.hotelName").value("The Taj Mahal Palace View"))
                .andExpect(jsonPath("$.guestName").value("Atul Prajapati"))
                .andExpect(jsonPath("$.email").value("atul@example.com"))
                .andExpect(jsonPath("$.checkIn").value(checkIn.toString()))
                .andExpect(jsonPath("$.checkOut").value(checkIn.plusDays(1).toString()))
                .andExpect(jsonPath("$.numberOfNights").value(1))
                .andExpect(jsonPath("$.pricePerNight").value(11500.00))
                .andExpect(jsonPath("$.totalAmount").value(12880.00))
                .andExpect(jsonPath("$.currency").value("INR"))
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andReturn();

        String ref = objectMapper.readTree(oneNightResult.getResponse().getContentAsString())
                .get("bookingReference").asText();

        // Retrieve via GET /api/bookings/{reference}?email=...
        mockMvc.perform(get("/api/bookings/" + ref)
                        .param("email", "ATUL@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingReference").value(ref))
                .andExpect(jsonPath("$.numberOfNights").value(1));

        // Wrong email and invalid reference return 404
        mockMvc.perform(get("/api/bookings/" + ref)
                        .param("email", "wrong@example.com"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/bookings/HTL-INVALID99")
                        .param("email", "atul@example.com"))
                .andExpect(status().isNotFound());

        // 3-night stay on RoomType 4 (Executive Business Room at hotel 2, INR 6,200.00/night -> 18,600 + 2,232 = 20,832.00)
        String threeNightBody = """
                {
                  "hotelId": 2,
                  "roomTypeId": 4,
                  "guestName": "Neha Kapoor",
                  "guestEmail": "neha@example.com",
                  "checkIn": "%s",
                  "checkOut": "%s"
                }
                """.formatted(checkIn, checkIn.plusDays(3));

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(threeNightBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.numberOfNights").value(3))
                .andExpect(jsonPath("$.pricePerNight").value(6200.00))
                .andExpect(jsonPath("$.totalAmount").value(20832.00));
    }

    @Test
    void rejectsInvalidDatesInvalidEntitiesAndMismatchedHotelRoom() throws Exception {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDate tomorrow = LocalDate.now().plusDays(2);

        // Past check-in
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hotelId": 1, "roomTypeId": 1,
                                  "guestName": "Test", "guestEmail": "test@example.com",
                                  "checkIn": "%s", "checkOut": "%s"
                                }
                                """.formatted(yesterday, tomorrow)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        // Check-out <= check-in
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hotelId": 1, "roomTypeId": 1,
                                  "guestName": "Test", "guestEmail": "test@example.com",
                                  "checkIn": "%s", "checkOut": "%s"
                                }
                                """.formatted(tomorrow, tomorrow)))
                .andExpect(status().isBadRequest());

        // Blank name / invalid email
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hotelId": 1, "roomTypeId": 1,
                                  "guestName": "", "guestEmail": "not-an-email",
                                  "checkIn": "%s", "checkOut": "%s"
                                }
                                """.formatted(tomorrow, tomorrow.plusDays(1))))
                .andExpect(status().isBadRequest());

        // Non-existent hotel or room
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hotelId": 9999, "roomTypeId": 1,
                                  "guestName": "Test", "guestEmail": "test@example.com",
                                  "checkIn": "%s", "checkOut": "%s"
                                }
                                """.formatted(tomorrow, tomorrow.plusDays(1))))
                .andExpect(status().isNotFound());

        // RoomType 4 belongs to hotel 2, not hotel 1
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hotelId": 1, "roomTypeId": 4,
                                  "guestName": "Test", "guestEmail": "test@example.com",
                                  "checkIn": "%s", "checkOut": "%s"
                                }
                                """.formatted(tomorrow, tomorrow.plusDays(1))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void overlappingRejectedBackToBackAllowedAndPatchCancelReleasesCapacity() throws Exception {
        LocalDate checkIn = LocalDate.now().plusDays(12);
        LocalDate checkOut = checkIn.plusDays(2);

        // RoomType 3 has totalRooms = 1
        MvcResult first = mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hotelId": 1, "roomTypeId": 3,
                                  "guestName": "Guest One", "guestEmail": "one@example.com",
                                  "checkIn": "%s", "checkOut": "%s"
                                }
                                """.formatted(checkIn, checkOut)))
                .andExpect(status().isCreated())
                .andReturn();

        String ref = objectMapper.readTree(first.getResponse().getContentAsString())
                .get("bookingReference").asText();

        // Overlapping reservation fails with 409
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hotelId": 1, "roomTypeId": 3,
                                  "guestName": "Guest Two", "guestEmail": "two@example.com",
                                  "checkIn": "%s", "checkOut": "%s"
                                }
                                """.formatted(checkIn.plusDays(1), checkOut.plusDays(1))))
                .andExpect(status().isConflict());

        // Back-to-back reservation succeeds (checkIn == checkOut)
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hotelId": 1, "roomTypeId": 3,
                                  "guestName": "Guest Three", "guestEmail": "three@example.com",
                                  "checkIn": "%s", "checkOut": "%s"
                                }
                                """.formatted(checkOut, checkOut.plusDays(2))))
                .andExpect(status().isCreated());

        // PATCH cancel releases capacity
        mockMvc.perform(patch("/api/bookings/" + ref + "/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"one@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.cancelledAt").isNotEmpty());

        // Duplicate cancellation returns 409 Conflict
        mockMvc.perform(patch("/api/bookings/" + ref + "/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"one@example.com\"}"))
                .andExpect(status().isConflict());

        // Original dates can now be booked again
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "hotelId": 1, "roomTypeId": 3,
                                  "guestName": "Guest Four", "guestEmail": "four@example.com",
                                  "checkIn": "%s", "checkOut": "%s"
                                }
                                """.formatted(checkIn, checkOut)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));
    }

    @Test
    void idempotencyKeyPreventsDuplicateReservationsAndRejectsMismatchedPayload() throws Exception {
        LocalDate checkIn = LocalDate.now().plusDays(18);
        LocalDate checkOut = checkIn.plusDays(2);

        String body = """
                {
                  "hotelId": 1, "roomTypeId": 3,
                  "guestName": "Retry User", "guestEmail": "retry@example.com",
                  "checkIn": "%s", "checkOut": "%s"
                }
                """.formatted(checkIn, checkOut);

        MvcResult first = mockMvc.perform(post("/api/bookings")
                        .header("Idempotency-Key", "req-idem-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        String firstRef = objectMapper.readTree(first.getResponse().getContentAsString())
                .get("bookingReference").asText();

        // Retry with same key and payload returns 200 OK with exact same reference and creates no extra row
        mockMvc.perform(post("/api/bookings")
                        .header("Idempotency-Key", "req-idem-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingReference").value(firstRef));

        assertThat(bookingRepository.count()).isEqualTo(1L);

        // Same key with different dates returns 409 Conflict
        String differentBody = """
                {
                  "hotelId": 1, "roomTypeId": 3,
                  "guestName": "Retry User", "guestEmail": "retry@example.com",
                  "checkIn": "%s", "checkOut": "%s"
                }
                """.formatted(checkIn.plusDays(3), checkOut.plusDays(3));

        mockMvc.perform(post("/api/bookings")
                        .header("Idempotency-Key", "req-idem-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(differentBody))
                .andExpect(status().isConflict());
    }

    @Test
    void concurrentRequestsForLastRoomAllowOnlyOneConfirmedBooking() throws Exception {
        // RoomType 3 (Presidential Family Suite) has totalRooms = 1
        long roomTypeId = 3L;
        LocalDate checkIn = LocalDate.now().plusDays(25);
        LocalDate checkOut = checkIn.plusDays(2);

        int threads = 6;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch readyLatch = new CountDownLatch(threads);
        CountDownLatch startLatch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);
        List<Throwable> errors = Collections.synchronizedList(new ArrayList<>());

        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            final int idx = i;
            futures.add(executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    bookingService.createBooking(new CreateBookingRequest(
                            1L, roomTypeId, "Last Room Guest " + idx, "lastroom" + idx + "@example.com",
                            null, checkIn, checkOut, 2, null, null
                    ));
                    successCount.incrementAndGet();
                } catch (RoomUnavailableException ex) {
                    conflictCount.incrementAndGet();
                } catch (Throwable t) {
                    errors.add(t);
                }
            }));
        }

        assertThat(readyLatch.await(5, TimeUnit.SECONDS)).isTrue();
        startLatch.countDown();
        for (Future<?> f : futures) {
            f.get(15, TimeUnit.SECONDS);
        }
        executor.shutdown();

        assertThat(errors).isEmpty();
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(conflictCount.get()).isEqualTo(5);
        assertThat(bookingRepository.countOverlappingBookings(
                roomTypeId, BookingStatus.CONFIRMED, checkIn, checkOut
        )).isEqualTo(1L);
    }
}

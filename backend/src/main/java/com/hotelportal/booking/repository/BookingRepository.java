package com.hotelportal.booking.repository;

import com.hotelportal.booking.entity.Booking;
import com.hotelportal.booking.entity.BookingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @Query("""
            SELECT COUNT(b) FROM Booking b
            WHERE b.roomType.id = :roomTypeId
              AND b.status = :status
              AND b.checkInDate < :checkOutDate
              AND b.checkOutDate > :checkInDate
            """)
    long countOverlappingBookings(
            @Param("roomTypeId") Long roomTypeId,
            @Param("status") BookingStatus status,
            @Param("checkInDate") LocalDate checkInDate,
            @Param("checkOutDate") LocalDate checkOutDate
    );

    @Query("""
            SELECT b.roomType.id, COUNT(b) FROM Booking b
            WHERE b.roomType.id IN :roomTypeIds
              AND b.status = :status
              AND b.checkInDate < :checkOutDate
              AND b.checkOutDate > :checkInDate
            GROUP BY b.roomType.id
            """)
    List<Object[]> countOverlappingBookingsByRoomTypeIds(
            @Param("roomTypeIds") Collection<Long> roomTypeIds,
            @Param("status") BookingStatus status,
            @Param("checkInDate") LocalDate checkInDate,
            @Param("checkOutDate") LocalDate checkOutDate
    );

    @Query("""
            SELECT b FROM Booking b
            WHERE b.roomType.id IN :roomTypeIds
              AND b.status = :status
              AND b.checkInDate < :windowEnd
              AND b.checkOutDate > :windowStart
            """)
    List<Booking> findOverlappingBookingsInWindow(
            @Param("roomTypeIds") Collection<Long> roomTypeIds,
            @Param("status") BookingStatus status,
            @Param("windowStart") LocalDate windowStart,
            @Param("windowEnd") LocalDate windowEnd
    );

    @Query("""
            SELECT b FROM Booking b
            JOIN FETCH b.hotel
            JOIN FETCH b.roomType
            WHERE b.bookingReference = :reference
              AND LOWER(b.guestEmail) = LOWER(:email)
            """)
    Optional<Booking> findByReferenceAndEmail(
            @Param("reference") String reference,
            @Param("email") String email
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT b FROM Booking b
            JOIN FETCH b.hotel
            JOIN FETCH b.roomType
            WHERE b.bookingReference = :reference
              AND LOWER(b.guestEmail) = LOWER(:email)
            """)
    Optional<Booking> findByReferenceAndEmailForUpdate(
            @Param("reference") String reference,
            @Param("email") String email
    );

    boolean existsByBookingReference(String bookingReference);

    @Query("""
            SELECT b FROM Booking b
            JOIN FETCH b.hotel
            JOIN FETCH b.roomType
            WHERE b.idempotencyKey = :idempotencyKey
            """)
    Optional<Booking> findByIdempotencyKeyWithDetails(@Param("idempotencyKey") String idempotencyKey);
}

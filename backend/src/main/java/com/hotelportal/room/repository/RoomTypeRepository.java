package com.hotelportal.room.repository;

import com.hotelportal.room.entity.RoomType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {

    List<RoomType> findByHotelIdOrderByBasePricePerNightAsc(Long hotelId);

    List<RoomType> findByHotelIdIn(Collection<Long> hotelIds);

    @Query("SELECT COALESCE(MIN(r.basePricePerNight), 0) FROM RoomType r")
    BigDecimal findMinBasePricePerNight();

    @Query("SELECT COALESCE(MAX(r.basePricePerNight), 0) FROM RoomType r")
    BigDecimal findMaxBasePricePerNight();

    @Query("SELECT r FROM RoomType r JOIN FETCH r.hotel WHERE r.id = :id")
    Optional<RoomType> findByIdWithHotel(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RoomType r JOIN FETCH r.hotel WHERE r.id = :id")
    Optional<RoomType> findByIdWithHotelForUpdate(@Param("id") Long id);
}

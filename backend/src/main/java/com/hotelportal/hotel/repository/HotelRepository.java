package com.hotelportal.hotel.repository;

import com.hotelportal.hotel.entity.Hotel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HotelRepository extends JpaRepository<Hotel, Long> {

    @Query("""
            SELECT h FROM Hotel h
            WHERE (:city IS NULL OR :city = '' OR LOWER(h.city) LIKE LOWER(CONCAT('%', :city, '%')))
            """)
    Page<Hotel> searchByCity(@Param("city") String city, Pageable pageable);

    @Query("SELECT DISTINCT h.city FROM Hotel h ORDER BY h.city ASC")
    List<String> findDistinctCities();
}

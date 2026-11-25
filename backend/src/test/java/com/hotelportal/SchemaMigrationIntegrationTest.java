package com.hotelportal;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class SchemaMigrationIntegrationTest {

    @Autowired
    private EntityManager entityManager;

    @Test
    void flywaySeededFiveHotelsAndElevenRoomTypes() {
        Long hotelCount = entityManager.createQuery("SELECT COUNT(h) FROM Hotel h", Long.class)
                .getSingleResult();
        Long roomTypeCount = entityManager.createQuery("SELECT COUNT(r) FROM RoomType r", Long.class)
                .getSingleResult();

        assertThat(hotelCount).isEqualTo(5L);
        assertThat(roomTypeCount).isEqualTo(11L);
    }
}

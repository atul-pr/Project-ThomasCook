package com.hotelportal.common.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private static final String APPLICATION_NAME = "StayAtlas";

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public record HealthStatusResponse(String status, String application, String database) {
    }

    @GetMapping
    public ResponseEntity<HealthStatusResponse> checkHealth() {
        if (isDatabaseConnected()) {
            return ResponseEntity.ok(new HealthStatusResponse("UP", APPLICATION_NAME, "CONNECTED"));
        }
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new HealthStatusResponse("DOWN", APPLICATION_NAME, "DISCONNECTED"));
    }

    private boolean isDatabaseConnected() {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement("SELECT 1");
             ResultSet rs = statement.executeQuery()) {
            return rs.next();
        } catch (SQLException ex) {
            return false;
        }
    }
}

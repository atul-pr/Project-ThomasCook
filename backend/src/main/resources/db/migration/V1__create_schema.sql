CREATE TABLE hotels (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    star_rating INT NOT NULL,
    amenities VARCHAR(500) NOT NULL,
    image_url VARCHAR(500) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_hotels_city ON hotels (city);
CREATE INDEX idx_hotels_city_rating ON hotels (city, star_rating);

CREATE TABLE room_types (
    id BIGINT NOT NULL AUTO_INCREMENT,
    hotel_id BIGINT NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500) NOT NULL,
    base_price_per_night DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    max_guests INT NOT NULL,
    total_rooms INT NOT NULL,
    amenities VARCHAR(400) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_room_types_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_room_types_hotel_guests ON room_types (hotel_id, max_guests);

CREATE TABLE bookings (
    id BIGINT NOT NULL AUTO_INCREMENT,
    booking_reference VARCHAR(24) NOT NULL,
    hotel_id BIGINT NOT NULL,
    room_type_id BIGINT NOT NULL,
    guest_name VARCHAR(120) NOT NULL,
    guest_email VARCHAR(180) NOT NULL,
    guest_phone VARCHAR(30) NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guests INT NOT NULL,
    nights INT NOT NULL,
    price_per_night_snapshot DECIMAL(12, 2) NOT NULL,
    tax_amount_snapshot DECIMAL(12, 2) NOT NULL,
    total_amount_snapshot DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status VARCHAR(20) NOT NULL,
    special_requests VARCHAR(500) NULL,
    created_at DATETIME(6) NOT NULL,
    cancelled_at DATETIME(6) NULL,
    version BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uk_bookings_reference UNIQUE (booking_reference),
    CONSTRAINT fk_bookings_hotel FOREIGN KEY (hotel_id) REFERENCES hotels (id),
    CONSTRAINT fk_bookings_room_type FOREIGN KEY (room_type_id) REFERENCES room_types (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_bookings_room_status_dates
    ON bookings (room_type_id, status, check_in_date, check_out_date);

CREATE INDEX idx_bookings_ref_email
    ON bookings (booking_reference, guest_email);

CREATE INDEX idx_bookings_hotel_status
    ON bookings (hotel_id, status);

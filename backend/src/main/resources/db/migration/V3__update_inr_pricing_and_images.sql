UPDATE hotels
SET image_url = '/assets/images/hotel-mumbai.jpg',
    updated_at = CURRENT_TIMESTAMP(6)
WHERE id = 1;

UPDATE hotels
SET image_url = '/assets/images/hotel-bengaluru.jpg',
    updated_at = CURRENT_TIMESTAMP(6)
WHERE id = 2;

UPDATE hotels
SET image_url = '/assets/images/hotel-goa.jpg',
    updated_at = CURRENT_TIMESTAMP(6)
WHERE id = 3;

UPDATE hotels
SET image_url = '/assets/images/hotel-jaipur.jpg',
    updated_at = CURRENT_TIMESTAMP(6)
WHERE id = 4;

UPDATE hotels
SET image_url = '/assets/images/hotel-delhi.jpg',
    updated_at = CURRENT_TIMESTAMP(6)
WHERE id = 5;

UPDATE room_types SET base_price_per_night = 11500.00, currency = 'INR', updated_at = CURRENT_TIMESTAMP(6) WHERE id = 1;
UPDATE room_types SET base_price_per_night = 19500.00, currency = 'INR', updated_at = CURRENT_TIMESTAMP(6) WHERE id = 2;
UPDATE room_types SET base_price_per_night = 32000.00, currency = 'INR', updated_at = CURRENT_TIMESTAMP(6) WHERE id = 3;

UPDATE room_types SET base_price_per_night = 6200.00, currency = 'INR', updated_at = CURRENT_TIMESTAMP(6) WHERE id = 4;
UPDATE room_types SET base_price_per_night = 9800.00, currency = 'INR', updated_at = CURRENT_TIMESTAMP(6) WHERE id = 5;

UPDATE room_types SET base_price_per_night = 8500.00, currency = 'INR', updated_at = CURRENT_TIMESTAMP(6) WHERE id = 6;
UPDATE room_types SET base_price_per_night = 18500.00, currency = 'INR', updated_at = CURRENT_TIMESTAMP(6) WHERE id = 7;

UPDATE room_types SET base_price_per_night = 5800.00, currency = 'INR', updated_at = CURRENT_TIMESTAMP(6) WHERE id = 8;
UPDATE room_types SET base_price_per_night = 13500.00, currency = 'INR', updated_at = CURRENT_TIMESTAMP(6) WHERE id = 9;

UPDATE room_types SET base_price_per_night = 7400.00, currency = 'INR', updated_at = CURRENT_TIMESTAMP(6) WHERE id = 10;
UPDATE room_types SET base_price_per_night = 16200.00, currency = 'INR', updated_at = CURRENT_TIMESTAMP(6) WHERE id = 11;

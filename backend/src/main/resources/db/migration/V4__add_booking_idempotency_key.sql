ALTER TABLE bookings
    ADD COLUMN idempotency_key VARCHAR(100) NULL;

ALTER TABLE bookings
    ADD CONSTRAINT uk_bookings_idempotency_key UNIQUE (idempotency_key);

package com.hotelportal.pricing.dto;

import java.math.BigDecimal;

public record PriceBreakdown(
        int nights,
        BigDecimal pricePerNight,
        BigDecimal subtotal,
        BigDecimal taxRate,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String currency
) {
}

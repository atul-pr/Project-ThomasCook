package com.hotelportal.pricing.service;

import com.hotelportal.common.exception.InvalidDateRangeException;
import com.hotelportal.pricing.dto.PriceBreakdown;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
public class PricingService {

    private final BigDecimal taxRate;

    public PricingService(@Value("${app.pricing.tax-rate:0.12}") BigDecimal taxRate) {
        this.taxRate = taxRate;
    }

    public PriceBreakdown calculatePrice(BigDecimal basePricePerNight, String currency, LocalDate checkIn, LocalDate checkOut) {
        long days = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (days <= 0) {
            throw new InvalidDateRangeException("Check-out date must be after check-in date");
        }
        int nights = Math.toIntExact(days);
        BigDecimal nightly = basePricePerNight.setScale(2, RoundingMode.HALF_UP);
        BigDecimal subtotal = nightly.multiply(BigDecimal.valueOf(nights)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal taxAmount = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

        return new PriceBreakdown(
                nights,
                nightly,
                subtotal,
                taxRate,
                taxAmount,
                totalAmount,
                currency
        );
    }
}

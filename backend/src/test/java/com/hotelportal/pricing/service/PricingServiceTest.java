package com.hotelportal.pricing.service;

import com.hotelportal.common.exception.InvalidDateRangeException;
import com.hotelportal.pricing.dto.PriceBreakdown;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PricingServiceTest {

    private final PricingService pricingService = new PricingService(new BigDecimal("0.12"));

    @Test
    void calculatesNightsSubtotalTaxAndTotalAccurately() {
        LocalDate checkIn = LocalDate.now().plusDays(5);
        LocalDate checkOut = checkIn.plusDays(3);

        PriceBreakdown breakdown = pricingService.calculatePrice(new BigDecimal("180.00"), "USD", checkIn, checkOut);

        assertThat(breakdown.nights()).isEqualTo(3);
        assertThat(breakdown.pricePerNight()).isEqualByComparingTo("180.00");
        assertThat(breakdown.subtotal()).isEqualByComparingTo("540.00");
        assertThat(breakdown.taxAmount()).isEqualByComparingTo("64.80");
        assertThat(breakdown.totalAmount()).isEqualByComparingTo("604.80");
        assertThat(breakdown.currency()).isEqualTo("USD");
    }

    @Test
    void rejectsZeroOrNegativeNights() {
        LocalDate checkIn = LocalDate.now().plusDays(5);

        assertThatThrownBy(() -> pricingService.calculatePrice(new BigDecimal("100.00"), "USD", checkIn, checkIn))
                .isInstanceOf(InvalidDateRangeException.class);
        assertThatThrownBy(() -> pricingService.calculatePrice(new BigDecimal("100.00"), "USD", checkIn, checkIn.minusDays(1)))
                .isInstanceOf(InvalidDateRangeException.class);
    }
}

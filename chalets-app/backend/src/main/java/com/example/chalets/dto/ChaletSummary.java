package com.example.chalets.dto;

import java.math.BigDecimal;

/**
 * ملخص شاليه واحد، يُستخدم في كروت الصفحة الرئيسية.
 *
 * مثال: { "chaletId": 1, "name": "Chalet 1", "total": 6500.00, "bookings": 12 }
 */
public record ChaletSummary(
        Integer chaletId,
        String name,
        BigDecimal total,
        long bookings
) {
}

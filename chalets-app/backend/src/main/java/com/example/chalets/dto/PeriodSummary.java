package com.example.chalets.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * ملخص فترة محاسبية واحدة.
 *
 * الفترة عندنا تبدأ يوم 13 وتنتهي يوم 12 من الشهر التالي.
 * مثال: { start: 2026-09-13, end: 2026-10-12, label: "13 سبتمبر – 12 أكتوبر 2026" }
 *
 * current  = الفترة التي نعيشها الآن.
 * upcoming = الفترة التي تليها مباشرة (الشهر الجاي).
 */
public record PeriodSummary(
        LocalDate start,
        LocalDate end,
        String label,
        BigDecimal total,
        long bookings,
        boolean current,
        boolean upcoming
) {
}

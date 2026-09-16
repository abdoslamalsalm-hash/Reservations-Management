package com.example.chalets.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * شكل البيانات القادمة من الواجهة عند إضافة حجز جديد (POST /api/bookings).
 *
 * record في جافا = كلاس صغير للبيانات فقط، ينشئ الـ getters والـ constructor تلقائيًا.
 * نستخدم DTO منفصل عن الـ Entity حتى لا يقدر المستخدم يرسل id بنفسه.
 */
public record BookingRequest(

        @NotNull(message = "chaletId مطلوب")
        @Min(value = 1, message = "رقم الشاليه يجب أن يكون بين 1 و 6")
        @Max(value = 6, message = "رقم الشاليه يجب أن يكون بين 1 و 6")
        Integer chaletId,

        @NotNull(message = "التاريخ مطلوب")
        LocalDate date,

        @NotNull(message = "السعر مطلوب")
        @DecimalMin(value = "0.0", inclusive = false, message = "السعر يجب أن يكون أكبر من صفر")
        BigDecimal price,

        @NotBlank(message = "اسم الحاجز مطلوب")
        @Size(max = 100, message = "اسم الحاجز طويل جدًا (الحد 100 حرف)")
        String guestName,

        @Size(max = 500, message = "الملاحظات طويلة جدًا (الحد 500 حرف)")
        String notes
) {
}

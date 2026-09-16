package com.example.chalets.dto;

import com.example.chalets.model.Booking;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * شكل الحجز عند إرساله للواجهة (JSON).
 */
public record BookingResponse(
        Long id,
        Integer chaletId,
        LocalDate date,
        BigDecimal price,
        String guestName,
        String notes
) {

    /** يحوّل كائن Booking القادم من قاعدة البيانات إلى الشكل المرسل للواجهة */
    public static BookingResponse from(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getChaletId(),
                booking.getDate(),
                booking.getPrice(),
                booking.getGuestName(),
                booking.getNotes()
        );
    }
}

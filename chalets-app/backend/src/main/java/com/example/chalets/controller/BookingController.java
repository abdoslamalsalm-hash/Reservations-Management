package com.example.chalets.controller;

import com.example.chalets.dto.BookingRequest;
import com.example.chalets.dto.BookingResponse;
import com.example.chalets.dto.DashboardResponse;
import com.example.chalets.dto.PeriodSummary;
import com.example.chalets.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * واجهة الـ REST API.
 *
 * كل المسارات تبدأ بـ /api
 *
 *  GET    /api/summary?from=2026-09-13&to=2026-10-13   -> ملخص الشاليهات الستة
 *  GET    /api/periods                                  -> الفترات المحاسبية وإجمالي كل فترة
 *  GET    /api/bookings?chaletId=1&from=...&to=...      -> حجوزات شاليه معيّن
 *  POST   /api/bookings                                 -> إضافة حجز
 *  PUT    /api/bookings/{id}                            -> تعديل حجز
 *  DELETE /api/bookings/{id}                            -> حذف حجز
 */
@RestController
@RequestMapping("/api")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    /**
     * ملخص الصفحة الرئيسية.
     * from و to اختياريان: إذا ما أرسلتهما يحسب على كل الحجوزات.
     * صيغة التاريخ: yyyy-MM-dd (مثال: 2026-09-13)
     */
    @GetMapping("/summary")
    public DashboardResponse getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return bookingService.getSummary(from, to);
    }

    /**
     * الفترات المحاسبية (13 من الشهر إلى 12 من الشهر التالي) وإجمالي كل فترة.
     * مرتبة من الأحدث للأقدم.
     */
    @GetMapping("/periods")
    public List<PeriodSummary> getPeriods() {
        return bookingService.getPeriods();
    }

    /** حجوزات شاليه معيّن (مع فلترة اختيارية بالتاريخ) */
    @GetMapping("/bookings")
    public List<BookingResponse> getBookings(
            @RequestParam Integer chaletId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return bookingService.getBookingsForChalet(chaletId, from, to);
    }

    /**
     * إضافة حجز جديد.
     * @Valid يفعّل التحقق المكتوب في BookingRequest (الشاليه 1-6، السعر > 0 ...).
     */
    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse addBooking(@Valid @RequestBody BookingRequest request) {
        return bookingService.addBooking(request);
    }

    /** تعديل حجز موجود (تغيير التاريخ أو السعر) */
    @PutMapping("/bookings/{id}")
    public BookingResponse updateBooking(
            @PathVariable Long id,
            @Valid @RequestBody BookingRequest request
    ) {
        return bookingService.updateBooking(id, request);
    }

    /** حذف حجز */
    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }
}

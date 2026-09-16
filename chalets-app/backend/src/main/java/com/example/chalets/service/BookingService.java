package com.example.chalets.service;

import com.example.chalets.dto.BookingRequest;
import com.example.chalets.dto.BookingResponse;
import com.example.chalets.dto.ChaletSummary;
import com.example.chalets.dto.DashboardResponse;
import com.example.chalets.dto.PeriodSummary;
import com.example.chalets.model.Booking;
import com.example.chalets.repository.BookingRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * طبقة المنطق (Business Logic).
 *
 * هنا نحسب المجاميع ونتعامل مع الفلترة بالتاريخ،
 * والـ Controller يبقى بسيط وظيفته استقبال الطلب وإرجاع الرد فقط.
 */
@Service
public class BookingService {

    /** عدد الشاليهات ثابت */
    public static final int CHALETS_COUNT = 6;

    /**
     * اليوم الذي تبدأ منه الفترة المحاسبية.
     * الفترة تبدأ يوم 13 وتنتهي يوم 12 من الشهر التالي،
     * فلا يوجد يوم يُحسب في فترتين.
     */
    public static final int PERIOD_START_DAY = 13;

    /** أسماء الشهور بالعربي (الفهرس 0 = يناير) */
    private static final String[] MONTH_NAMES = {
            "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    };

    private final BookingRepository bookingRepository;

    /** Spring يمرّر الـ Repository تلقائيًا عبر الـ constructor */
    public BookingService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    // ============ إضافة حجز ============

    public BookingResponse addBooking(BookingRequest request) {
        Booking booking = new Booking(
                request.chaletId(),
                request.date(),
                request.price(),
                clean(request.guestName()),
                clean(request.notes())
        );
        Booking saved = bookingRepository.save(booking);
        return BookingResponse.from(saved);
    }

    /**
     * ينظّف النص: يشيل المسافات الزائدة، ويحوّل الفاضي إلى null
     * عشان ما نخزّن "" في قاعدة البيانات.
     */
    private String clean(String text) {
        if (text == null) return null;
        String trimmed = text.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    // ============ تعديل حجز ============

    /**
     * يعدّل تاريخ وسعر حجز موجود.
     * نجيب الحجز من قاعدة البيانات، نغيّر قيمه، ثم نحفظه —
     * JPA يعرف أنه موجود مسبقًا (لأن الـ id موجود) فيسوي UPDATE بدل INSERT.
     */
    public BookingResponse updateBooking(Long id, BookingRequest request) {
        Booking booking = bookingRepository.findById(id)
                .filter(existing -> !existing.isDeleted())
                .orElseThrow(() -> new IllegalArgumentException("لا يوجد حجز بهذا الرقم: " + id));

        booking.setChaletId(request.chaletId());
        booking.setDate(request.date());
        booking.setPrice(request.price());
        booking.setGuestName(clean(request.guestName()));
        booking.setNotes(clean(request.notes()));

        Booking saved = bookingRepository.save(booking);
        return BookingResponse.from(saved);
    }

    // ============ حذف حجز (حذف ناعم) ============

    /**
     * لا نمسح الصف من قاعدة البيانات، بل نعلّمه كمحذوف.
     * الحجز يختفي من الواجهة ومن كل المجاميع، لكنه يبقى محفوظًا
     * ويمكن استرجاعه لاحقًا لو انحذف بالغلط.
     */
    public void deleteBooking(Long id) {
        Booking booking = bookingRepository.findById(id)
                .filter(existing -> !existing.isDeleted())
                .orElseThrow(() -> new IllegalArgumentException("لا يوجد حجز بهذا الرقم: " + id));

        booking.setDeleted(true);
        bookingRepository.save(booking);
    }

    // ============ حجوزات شاليه واحد ============

    /**
     * يرجع حجوزات شاليه معيّن.
     * إذا أرسلت from و to يرجع الحجوزات داخل الفترة فقط، وإلا يرجع الكل.
     */
    public List<BookingResponse> getBookingsForChalet(Integer chaletId, LocalDate from, LocalDate to) {
        validateChaletId(chaletId);

        List<Booking> bookings;
        if (from != null && to != null) {
            bookings = bookingRepository
                    .findByChaletIdAndDateBetweenAndDeletedFalseOrderByDateAsc(chaletId, from, to);
        } else {
            bookings = bookingRepository.findByChaletIdAndDeletedFalseOrderByDateAsc(chaletId);
        }

        List<BookingResponse> result = new ArrayList<>();
        for (Booking booking : bookings) {
            result.add(BookingResponse.from(booking));
        }
        return result;
    }

    // ============ ملخص الصفحة الرئيسية ============

    /**
     * يحسب لكل شاليه: مجموع الأسعار وعدد الحجوزات، ثم الإجمالي العام.
     * إذا أرسلت from و to، الحساب يكون على الحجوزات داخل الفترة فقط.
     */
    public DashboardResponse getSummary(LocalDate from, LocalDate to) {

        // 1) اجلب الحجوزات (كلها أو داخل الفترة)
        List<Booking> bookings;
        if (from != null && to != null) {
            bookings = bookingRepository.findByDateBetweenAndDeletedFalse(from, to);
        } else {
            bookings = bookingRepository.findByDeletedFalse();
        }

        // 2) جهّز مصفوفتين: مجموع كل شاليه، وعدد حجوزات كل شاليه
        //    الفهرس 0 = Chalet 1 ... الفهرس 5 = Chalet 6
        BigDecimal[] totals = new BigDecimal[CHALETS_COUNT];
        long[] counts = new long[CHALETS_COUNT];
        for (int i = 0; i < CHALETS_COUNT; i++) {
            totals[i] = BigDecimal.ZERO;
            counts[i] = 0;
        }

        // 3) مرّ على كل حجز وأضفه لشاليهه
        for (Booking booking : bookings) {
            int index = booking.getChaletId() - 1;
            if (index >= 0 && index < CHALETS_COUNT) {
                totals[index] = totals[index].add(booking.getPrice());
                counts[index] = counts[index] + 1;
            }
        }

        // 4) ابنِ قائمة الملخصات + الإجمالي العام
        List<ChaletSummary> summaries = new ArrayList<>();
        BigDecimal grandTotal = BigDecimal.ZERO;
        long totalBookings = 0;

        for (int i = 0; i < CHALETS_COUNT; i++) {
            int chaletId = i + 1;
            summaries.add(new ChaletSummary(
                    chaletId,
                    "شاليه " + chaletId,
                    totals[i],
                    counts[i]
            ));
            grandTotal = grandTotal.add(totals[i]);
            totalBookings = totalBookings + counts[i];
        }

        return new DashboardResponse(summaries, grandTotal, totalBookings);
    }

    // ============ الفترات المحاسبية ============

    /**
     * بداية الفترة التي يقع فيها هذا التاريخ.
     *
     * 2026-09-20  ->  2026-09-13  (اليوم 20 بعد 13، فالفترة بدأت هذا الشهر)
     * 2026-09-05  ->  2026-08-13  (اليوم 5 قبل 13، فالفترة بدأت الشهر الماضي)
     */
    public static LocalDate periodStartFor(LocalDate date) {
        if (date.getDayOfMonth() >= PERIOD_START_DAY) {
            return date.withDayOfMonth(PERIOD_START_DAY);
        }
        return date.minusMonths(1).withDayOfMonth(PERIOD_START_DAY);
    }

    /** نهاية الفترة: اليوم 12 من الشهر التالي لبدايتها */
    public static LocalDate periodEndFor(LocalDate start) {
        return start.plusMonths(1).minusDays(1);
    }

    /** "13 سبتمبر – 12 أكتوبر 2026" */
    private String buildLabel(LocalDate start, LocalDate end) {
        String startPart = start.getDayOfMonth() + " " + MONTH_NAMES[start.getMonthValue() - 1];
        String endPart = end.getDayOfMonth() + " " + MONTH_NAMES[end.getMonthValue() - 1];

        if (start.getYear() != end.getYear()) {
            return startPart + " " + start.getYear() + " – " + endPart + " " + end.getYear();
        }
        return startPart + " – " + endPart + " " + end.getYear();
    }

    /**
     * يرجع كل الفترات التي فيها حجوزات، مع إجمالي كل فترة.
     * الأحدث أولاً، والفترة الحالية والفترة القادمة موجودتان دائمًا
     * حتى لو كانتا فاضيتين.
     */
    public List<PeriodSummary> getPeriods() {
        List<Booking> bookings = bookingRepository.findByDeletedFalse();

        // 1) اجمع كل حجز في فترته
        Map<LocalDate, BigDecimal> totals = new HashMap<>();
        Map<LocalDate, Long> counts = new HashMap<>();

        for (Booking booking : bookings) {
            LocalDate start = periodStartFor(booking.getDate());
            totals.merge(start, booking.getPrice(), BigDecimal::add);
            counts.merge(start, 1L, Long::sum);
        }

        // 2) الفترة الحالية تظهر دائمًا (حتى لو ما فيها حجوزات)
        LocalDate currentStart = periodStartFor(LocalDate.now());
        totals.putIfAbsent(currentStart, BigDecimal.ZERO);
        counts.putIfAbsent(currentStart, 0L);

        // 3) والفترة القادمة كذلك، عشان تقدر تسجّل حجوزات الشهر الجاي
        //    قبل ما يبدأ، بدون ما تنتظر أول حجز فيها عشان تظهر.
        LocalDate nextStart = currentStart.plusMonths(1);
        totals.putIfAbsent(nextStart, BigDecimal.ZERO);
        counts.putIfAbsent(nextStart, 0L);

        // 4) رتّب من الأحدث للأقدم
        List<LocalDate> starts = new ArrayList<>(totals.keySet());
        starts.sort(Comparator.reverseOrder());

        List<PeriodSummary> result = new ArrayList<>();
        for (LocalDate start : starts) {
            LocalDate end = periodEndFor(start);
            result.add(new PeriodSummary(
                    start,
                    end,
                    buildLabel(start, end),
                    totals.get(start),
                    counts.get(start),
                    start.equals(currentStart),
                    start.equals(nextStart)
            ));
        }
        return result;
    }

    // ============ مساعد ============

    private void validateChaletId(Integer chaletId) {
        if (chaletId == null || chaletId < 1 || chaletId > CHALETS_COUNT) {
            throw new IllegalArgumentException("رقم الشاليه يجب أن يكون بين 1 و " + CHALETS_COUNT);
        }
    }
}

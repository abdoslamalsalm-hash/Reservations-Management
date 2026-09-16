package com.example.chalets.repository;

import com.example.chalets.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

/**
 * طبقة الوصول لقاعدة البيانات.
 *
 * ما نكتب SQL بأنفسنا: Spring Data JPA يفهم اسم الميثود ويبني الاستعلام تلقائيًا.
 * مثال: findByDateBetweenAndDeletedFalse
 *   ->  SELECT * FROM bookings WHERE booking_date BETWEEN ? AND ? AND deleted = false
 *
 * ونرث من JpaRepository جاهزًا: save() و findById() و findAll().
 *
 * ملاحظة: كل الميثودات هنا تنتهي بـ AndDeletedFalse (أو DeletedFalse)
 * عشان تتجاهل الحجوزات المحذوفة حذفًا ناعمًا.
 */
public interface BookingRepository extends JpaRepository<Booking, Long> {

    /** كل الحجوزات غير المحذوفة (لجميع الشاليهات) */
    List<Booking> findByDeletedFalse();

    /** كل حجوزات شاليه معيّن، مرتبة بالتاريخ */
    List<Booking> findByChaletIdAndDeletedFalseOrderByDateAsc(Integer chaletId);

    /** حجوزات شاليه معيّن داخل فترة تاريخية (شاملة الطرفين) مرتبة بالتاريخ */
    List<Booking> findByChaletIdAndDateBetweenAndDeletedFalseOrderByDateAsc(
            Integer chaletId, LocalDate from, LocalDate to);

    /** كل الحجوزات (لجميع الشاليهات) داخل فترة تاريخية */
    List<Booking> findByDateBetweenAndDeletedFalse(LocalDate from, LocalDate to);
}

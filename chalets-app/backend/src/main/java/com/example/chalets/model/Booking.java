package com.example.chalets.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * الجدول الوحيد في المشروع: bookings
 *
 * كل صف = حجز واحد:
 *   - أي شاليه (1 إلى 6)
 *   - في أي تاريخ
 *   - بكم سعر
 *
 * ما فيه جدول للشاليهات لأن عددها ثابت (6) وأسماؤها مجرد "شاليه 1 ... شاليه 6".
 */
@Entity
@Table(name = "bookings")
public class Booking {

    /** المعرّف، يزيد تلقائيًا من قاعدة البيانات */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** رقم الشاليه: من 1 إلى 6 */
    @Column(name = "chalet_id", nullable = false)
    private Integer chaletId;

    /**
     * تاريخ الحجز.
     * سمّيناه booking_date في قاعدة البيانات لأن كلمة "date" محجوزة في SQL.
     */
    @Column(name = "booking_date", nullable = false)
    private LocalDate date;

    /**
     * السعر بالريال.
     * نستخدم BigDecimal وليس double لأن double يسبب أخطاء تقريب في المبالغ المالية.
     */
    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    /**
     * اسم من حجز.
     * العمود يقبل NULL عشان الحجوزات القديمة المسجّلة قبل إضافة هذا الحقل،
     * لكن الإضافة الجديدة تطلبه (التحقق في BookingRequest).
     */
    @Column(name = "guest_name", length = 100)
    private String guestName;

    /** ملاحظات اختيارية على الحجز */
    @Column(name = "notes", length = 500)
    private String notes;

    /**
     * الحذف الناعم (Soft Delete).
     *
     * لما يضغط المستخدم "حذف" ما نمسح الصف من قاعدة البيانات،
     * بل نجعل هذا الحقل true. كل الاستعلامات تتجاهل الصفوف المعلّمة كمحذوفة،
     * فتختفي من الواجهة لكنها تبقى محفوظة ويمكن استرجاعها.
     */
    @Column(name = "deleted", nullable = false,
            columnDefinition = "boolean not null default false")
    private boolean deleted = false;

    /** JPA يحتاج constructor فاضي */
    public Booking() {
    }

    public Booking(Integer chaletId, LocalDate date, BigDecimal price,
                   String guestName, String notes) {
        this.chaletId = chaletId;
        this.date = date;
        this.price = price;
        this.guestName = guestName;
        this.notes = notes;
    }

    // ===== Getters & Setters =====

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getChaletId() {
        return chaletId;
    }

    public void setChaletId(Integer chaletId) {
        this.chaletId = chaletId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getGuestName() {
        return guestName;
    }

    public void setGuestName(String guestName) {
        this.guestName = guestName;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    /** لاحظ: getter الـ boolean يبدأ بـ is وليس get */
    public boolean isDeleted() {
        return deleted;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }
}

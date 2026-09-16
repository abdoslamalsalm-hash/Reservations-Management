"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  getBookings,
  addBooking,
  updateBooking,
  deleteBooking,
} from "@/lib/api";
import { formatMoney, formatDate, formatWeekday, isPeakDay } from "@/lib/format";
import DateField from "../../components/DateField";

/**
 * useSearchParams يحتاج Suspense في Next.js،
 * فنلفّ المحتوى الحقيقي بداخله.
 */
export default function ChaletPage() {
  return (
    <Suspense fallback={<p className="empty">جارٍ التحميل...</p>}>
      <ChaletPageContent />
    </Suspense>
  );
}

function ChaletPageContent() {
  // رقم الشاليه يأتي من الرابط /chalet/1
  const params = useParams();
  const chaletId = Number(params.id);

  // الفترة تأتي من الرابط: /chalet/1?from=2026-09-13&to=2026-10-12
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const hasPeriod = Boolean(from && to);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // ===== فورم الإضافة =====
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newGuest, setNewGuest] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // ===== التعديل داخل الجدول =====
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editGuest, setEditGuest] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // ===== تأكيد الحذف =====
  const [confirmingId, setConfirmingId] = useState(null);

  // رقم الحجز الذي فُتحت ملاحظته كاملة (واحد في كل مرة)
  const [expandedNotes, setExpandedNotes] = useState(null);

  /** يجلب حجوزات هذا الشاليه (داخل الفترة إذا كانت محددة) */
  async function loadBookings() {
    setLoading(true);
    setError("");
    try {
      const data = await getBookings(chaletId, from, to);
      setBookings(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (chaletId >= 1 && chaletId <= 6) {
      loadBookings();
    } else {
      setError("رقم شاليه غير صحيح");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaletId, from, to]);

  // ===================== إضافة =====================

  async function handleAdd(event) {
    event.preventDefault();
    setError("");

    if (!newDate) {
      setError("اختر تاريخًا من التقويم أو اكتبه بصيغة يوم/شهر/سنة");
      return;
    }
    if (!newGuest.trim()) {
      setError("اكتب اسم الحاجز");
      return;
    }
    if (!newPrice || Number(newPrice) <= 0) {
      setError("اكتب سعرًا أكبر من صفر");
      return;
    }

    setSaving(true);
    try {
      await addBooking(chaletId, newDate, newPrice, newGuest, newNotes);

      setNewDate("");
      setNewGuest("");
      setNewPrice("");
      setNewNotes("");
      setShowForm(false);
      await loadBookings();

      // تنبيه لو الحجز وقع خارج الفترة المعروضة فاختفى من الجدول
      if (hasPeriod && (newDate < from || newDate > to)) {
        setError(
          "تم حفظ الحجز، لكنه خارج الفترة المعروضة فلا يظهر في هذا الجدول."
        );
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ===================== تعديل =====================

  function startEditing(booking) {
    setEditingId(booking.id);
    setEditDate(booking.date);
    setEditGuest(booking.guestName || "");
    setEditPrice(String(booking.price));
    setEditNotes(booking.notes || "");
    setConfirmingId(null);
    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditDate("");
    setEditGuest("");
    setEditPrice("");
    setEditNotes("");
  }

  async function handleUpdate(bookingId) {
    setError("");

    if (!editDate) {
      setError("اختر تاريخًا صحيحًا");
      return;
    }
    if (!editGuest.trim()) {
      setError("اكتب اسم الحاجز");
      return;
    }
    if (!editPrice || Number(editPrice) <= 0) {
      setError("اكتب سعرًا أكبر من صفر");
      return;
    }

    setSaving(true);
    try {
      await updateBooking(
        bookingId,
        chaletId,
        editDate,
        editPrice,
        editGuest,
        editNotes
      );
      cancelEditing();
      await loadBookings();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ===================== حذف =====================

  async function handleDelete(bookingId) {
    setError("");
    try {
      await deleteBooking(bookingId);
      setConfirmingId(null);
      await loadBookings();
    } catch (e) {
      setError(e.message);
    }
  }

  // ===== مؤشرات الصفحة =====
  const total = bookings.reduce((sum, booking) => sum + Number(booking.price), 0);
  const count = bookings.length;

  return (
    <div>
      <Link href="/" className="back-link">
        رجوع للوحة التحكم ←
      </Link>

      <div className="page-head">
        <div>
          <h1>شاليه {chaletId}</h1>
          <p className="subtitle">
            {hasPeriod
              ? `الحجوزات من ${formatDate(from)} إلى ${formatDate(to)}`
              : "كل الحجوزات المسجّلة"}
          </p>
        </div>

        {!showForm && (
          <button onClick={() => setShowForm(true)}>+ إضافة حجز</button>
        )}
      </div>

      {hasPeriod && (
        <p className="period-note">
          معروض حجوزات فترة واحدة فقط.{" "}
          <Link href={`/chalet/${chaletId}`}>اعرض كل الحجوزات</Link>
        </p>
      )}

      {error && <div className="message error">{error}</div>}

      {/* ===== شريط المؤشرات ===== */}
      {!loading && count > 0 && (
        <div className="stat-strip">
          <div className="stat">
            <span className="stat-label">{hasPeriod ? "إجمالي الفترة" : "الإجمالي"}</span>
            <span className="stat-value">{formatMoney(total)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">عدد الحجوزات</span>
            <span className="stat-value">{count}</span>
          </div>
        </div>
      )}

      {/* ===== فورم الإضافة ===== */}
      {showForm && (
        <form className="panel" onSubmit={handleAdd}>
          <h2>إضافة حجز</h2>
          <div className="form-row">
            <DateField
              id="new-date"
              label="التاريخ"
              value={newDate}
              onChange={setNewDate}
            />

            <div className="field">
              <label htmlFor="new-guest">اسم الحاجز</label>
              <input
                id="new-guest"
                type="text"
                maxLength={100}
                placeholder="مثال: أبو خالد"
                value={newGuest}
                onChange={(e) => setNewGuest(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="new-price">السعر (ريال)</label>
              <input
                id="new-price"
                type="number"
                min="1"
                step="0.01"
                inputMode="decimal"
                placeholder="500"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
              />
            </div>

            <div className="field grow">
              <label htmlFor="new-notes">ملاحظات (اختياري)</label>
              <input
                id="new-notes"
                type="text"
                maxLength={500}
                placeholder="مثال: دفع عربون 200"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>

            <button type="submit" disabled={saving}>
              {saving ? "جارٍ الحفظ..." : "إضافة"}
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      )}

      {/* ===== جدول الحجوزات ===== */}
      <div className="table-card">
        {loading && <p className="empty">جارٍ التحميل...</p>}

        {!loading && bookings.length === 0 && (
          <p className="empty">
            {hasPeriod
              ? "لا توجد حجوزات في هذه الفترة."
              : 'لا توجد حجوزات بعد. اضغط "إضافة حجز" لتسجيل أول حجز.'}
          </p>
        )}

        {!loading && bookings.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>اليوم</th>
                  <th>اسم الحاجز</th>
                  <th>السعر</th>
                  <th>ملاحظات</th>
                  <th className="actions-col">إجراءات</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) =>
                  editingId === booking.id ? (
                    /* ===== الصف في وضع التعديل ===== */
                    <tr key={booking.id} className="editing">
                      <td data-label="التاريخ">
                        <DateField
                          id={`edit-date-${booking.id}`}
                          label=""
                          value={editDate}
                          onChange={setEditDate}
                        />
                      </td>
                      <td className="muted-cell" data-label="اليوم">{formatWeekday(editDate)}</td>
                      <td data-label="اسم الحاجز">
                        <input
                          type="text"
                          maxLength={100}
                          aria-label="اسم الحاجز"
                          value={editGuest}
                          onChange={(e) => setEditGuest(e.target.value)}
                        />
                      </td>
                      <td data-label="السعر">
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          inputMode="decimal"
                          aria-label="السعر"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                        />
                      </td>
                      <td data-label="ملاحظات">
                        <input
                          type="text"
                          maxLength={500}
                          aria-label="ملاحظات"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                        />
                      </td>
                      <td className="actions-col" data-label="إجراءات">
                        <div className="row-actions">
                          <button
                            className="small"
                            disabled={saving}
                            onClick={() => handleUpdate(booking.id)}
                          >
                            {saving ? "..." : "حفظ"}
                          </button>
                          <button
                            className="small secondary"
                            onClick={cancelEditing}
                          >
                            إلغاء
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    /* ===== الصف العادي ===== */
                    <tr
                      key={booking.id}
                      className={isPeakDay(booking.date) ? "peak" : ""}
                    >
                      <td className="num" data-label="التاريخ">{formatDate(booking.date)}</td>
                      <td className="muted-cell" data-label="اليوم">{formatWeekday(booking.date)}</td>
                      <td data-label="اسم الحاجز">{booking.guestName || <span className="dash">—</span>}</td>
                      <td className="num" data-label="السعر">{formatMoney(booking.price)} ريال</td>
                      <td className="notes-cell" data-label="ملاحظات">
                        {booking.notes ? (
                          <div
                            className={
                              "notes-text" +
                              (expandedNotes === booking.id ? " expanded" : "")
                            }
                            title={
                              expandedNotes === booking.id
                                ? "اضغط للطيّ"
                                : "اضغط لعرض الملاحظة كاملة"
                            }
                            onClick={() =>
                              setExpandedNotes(
                                expandedNotes === booking.id ? null : booking.id
                              )
                            }
                          >
                            {booking.notes}
                          </div>
                        ) : (
                          <span className="dash">—</span>
                        )}
                      </td>
                      <td className="actions-col" data-label="إجراءات">
                        {confirmingId === booking.id ? (
                          <div className="row-actions">
                            <span className="confirm-text">تأكيد الحذف؟</span>
                            <button
                              className="small danger"
                              onClick={() => handleDelete(booking.id)}
                            >
                              نعم
                            </button>
                            <button
                              className="small secondary"
                              onClick={() => setConfirmingId(null)}
                            >
                              لا
                            </button>
                          </div>
                        ) : (
                          <div className="row-actions">
                            <button
                              className="link-action"
                              onClick={() => startEditing(booking)}
                            >
                              تعديل
                            </button>
                            <button
                              className="link-danger"
                              onClick={() => {
                                setConfirmingId(booking.id);
                                setEditingId(null);
                              }}
                            >
                              حذف
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>

              <tfoot>
                <tr>
                  <td>{hasPeriod ? "إجمالي الفترة" : "الإجمالي"}</td>
                  <td></td>
                  <td></td>
                  <td className="num">{formatMoney(total)} ريال</td>
                  <td></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {!loading && bookings.length > 0 && (
        <p className="legend">
          <span className="legend-mark" />
          الصفوف المظللة هي ليالي نهاية الأسبوع (الخميس والجمعة).
        </p>
      )}
    </div>
  );
}

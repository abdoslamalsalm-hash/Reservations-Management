"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSummary, getPeriods } from "@/lib/api";
import { formatMoney, formatDate } from "@/lib/format";
import DateField from "./components/DateField";

/**
 * لوحة التحكم.
 *
 * العرض الافتراضي هو الفترة المحاسبية الحالية (13 من الشهر إلى 12 من الشهر التالي).
 * وفيه خيار "نطاق مخصص" لو احتجت فترة غير قياسية.
 */
export default function DashboardPage() {
  // قائمة الفترات القادمة من الـ Backend
  const [periods, setPeriods] = useState([]);
  const [selectedStart, setSelectedStart] = useState(""); // "" = كل الفترات

  // ملخص الشاليهات للفترة المختارة
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // النطاق المخصص (اختياري)
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  /** يجلب الملخص لفترة محددة */
  async function loadSummary(fromDate, toDate) {
    setLoading(true);
    setError("");
    try {
      const data = await getSummary(fromDate, toDate);
      setSummary(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // أول تحميل: اجلب الفترات واعرض الفترة الحالية
  useEffect(() => {
    async function init() {
      try {
        const list = await getPeriods();
        setPeriods(list);

        const current = list.find((period) => period.current) || list[0];
        if (current) {
          setSelectedStart(current.start);
          await loadSummary(current.start, current.end);
        } else {
          await loadSummary("", "");
        }
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    }
    init();
  }, []);

  /** تغيير الفترة من القائمة المنسدلة */
  function handlePeriodChange(startValue) {
    setSelectedStart(startValue);

    if (startValue === "") {
      loadSummary("", "");
      return;
    }
    const period = periods.find((item) => item.start === startValue);
    if (period) {
      loadSummary(period.start, period.end);
    }
  }

  /** أسهم الفترة السابقة/التالية — القائمة مرتبة من الأحدث للأقدم */
  function stepPeriod(direction) {
    const index = periods.findIndex((item) => item.start === selectedStart);
    if (index === -1) return;

    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= periods.length) return;

    handlePeriodChange(periods[nextIndex].start);
  }

  function handleApplyCustomRange(event) {
    event.preventDefault();

    if (!from || !to) {
      setError("اختر تاريخ البداية وتاريخ النهاية");
      return;
    }
    if (from > to) {
      setError("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");
      return;
    }

    setSelectedStart("");
    loadSummary(from, to);
  }

  const selectedPeriod = periods.find((item) => item.start === selectedStart);
  const index = periods.findIndex((item) => item.start === selectedStart);

  // رابط صفحة الشاليه يحمل نفس الفترة عشان الأرقام تتطابق
  function chaletHref(chaletId) {
    if (selectedPeriod) {
      return `/chalet/${chaletId}?from=${selectedPeriod.start}&to=${selectedPeriod.end}`;
    }
    if (from && to) {
      return `/chalet/${chaletId}?from=${from}&to=${to}`;
    }
    return `/chalet/${chaletId}`;
  }

  function retry() {
    if (selectedPeriod) {
      loadSummary(selectedPeriod.start, selectedPeriod.end);
    } else if (from && to) {
      loadSummary(from, to);
    } else {
      loadSummary("", "");
    }
  }

  // أعلى إجمالي بين الشاليهات — نستخدمه لشريط المقارنة داخل كل كارت
  const highestTotal = summary
    ? summary.chalets.reduce((max, chalet) => Math.max(max, Number(chalet.total)), 0)
    : 0;

  return (
    <div>
      <h1>لوحة التحكم</h1>
      <p className="subtitle">
        {selectedPeriod
          ? "إيرادات الفترة " + selectedPeriod.label
          : from && to
          ? `الإيرادات من ${formatDate(from)} إلى ${formatDate(to)}`
          : "إجمالي الإيرادات لكل شاليه"}
      </p>

      {/* ===== اختيار الفترة ===== */}
      <div className="panel">
        <h2>الفترة</h2>

        <div className="period-bar">
          {/* السهم الأيمن = الفترة الأقدم (القائمة مرتبة من الأحدث للأقدم) */}
          <button
            type="button"
            className="secondary step"
            onClick={() => stepPeriod(1)}
            disabled={index === -1 || index >= periods.length - 1}
            aria-label="الفترة السابقة"
          >
            ›
          </button>

          <select
            id="period"
            value={selectedStart}
            onChange={(event) => handlePeriodChange(event.target.value)}
          >
            {periods.map((period) => (
              <option key={period.start} value={period.start}>
                {period.label}
                {period.current ? "  (الحالية)" : ""}
                {period.upcoming ? "  (القادمة)" : ""}
              </option>
            ))}
            <option value="">كل الفترات</option>
          </select>

          <button
            type="button"
            className="secondary step"
            onClick={() => stepPeriod(-1)}
            disabled={index <= 0}
            aria-label="الفترة التالية"
          >
            ‹
          </button>

          <button
            type="button"
            className="text-link as-button"
            onClick={() => setUseCustomRange(!useCustomRange)}
          >
            {useCustomRange ? "إخفاء النطاق المخصص" : "نطاق مخصص"}
          </button>
        </div>

        {/* ===== النطاق المخصص ===== */}
        {useCustomRange && (
          <form className="filter-row custom-range" onSubmit={handleApplyCustomRange}>
            <DateField id="from" label="من تاريخ" value={from} onChange={setFrom} />
            <DateField id="to" label="إلى تاريخ" value={to} onChange={setTo} />
            <button type="submit" disabled={loading}>
              تطبيق
            </button>
          </form>
        )}
      </div>

      {error && (
        <div className="message error">
          <span>{error}</span>
          <button type="button" className="secondary small" onClick={retry}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* ===== هيكل تحميل مؤقت (Skeleton) ===== */}
      {loading && (
        <div className="cards" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card skeleton-card">
              <span className="skeleton-line skeleton-name" />
              <span className="skeleton-line skeleton-total" />
              <span className="skeleton-line skeleton-count" />
            </div>
          ))}
        </div>
      )}

      {/* ===== كروت الشاليهات الستة ===== */}
      {!loading && summary && (
        <>
          <div className="cards">
            {summary.chalets.map((chalet) => {
              const total = Number(chalet.total);
              const isEmpty = chalet.bookings === 0;
              const isTop = !isEmpty && highestTotal > 0 && total === highestTotal;

              return (
                <Link
                  key={chalet.chaletId}
                  href={chaletHref(chalet.chaletId)}
                  className={`card${isEmpty ? " card-empty" : ""}`}
                >
                  <span className="card-name">
                    {chalet.name}
                    {isTop && <span className="chip chip-top">الأعلى</span>}
                  </span>

                  {isEmpty ? (
                    <span className="card-total card-total-empty">لا حجوزات</span>
                  ) : (
                    <span className="card-total">
                      {formatMoney(chalet.total)} <span>ريال</span>
                    </span>
                  )}

                  <span className="card-count">
                    عدد الحجوزات: {chalet.bookings}
                  </span>

                  <span className="card-bar-track">
                    <span
                      className="card-bar"
                      style={{
                        width: highestTotal > 0 ? (total / highestTotal) * 100 + "%" : "0%",
                      }}
                    />
                  </span>
                </Link>
              );
            })}
          </div>

          {/* ===== الإجمالي العام ===== */}
          <div className="grand-total">
            <div className="label">
              {selectedPeriod ? "إجمالي الفترة" : "الإجمالي العام"}
            </div>
            <div className="value">{formatMoney(summary.grandTotal)} ريال</div>
          </div>
        </>
      )}
    </div>
  );
}

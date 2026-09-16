"use client";

import { useEffect, useRef, useState } from "react";

/**
 * حقل تاريخ فيه طريقتان للإدخال:
 *   1. تقويم تضغط فيه على اليوم (زر التقويم)
 *   2. كتابة بالأرقام مباشرة: تكتب 15092026 والحقل يضيف "/" لحاله
 *
 * الخارج (value و onChange) يشتغل بصيغة yyyy-MM-dd لأنها الصيغة
 * التي يفهمها الـ Backend، والمستخدم يشوف يوم/شهر/سنة فقط.
 */

const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

/** الأسبوع يبدأ بالأحد */
const WEEKDAY_NAMES = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];

function pad(number) {
  return String(number).padStart(2, "0");
}

/** "2026-09-15" -> "15/09/2026" */
function isoToText(iso) {
  if (!iso) return "";
  const parts = iso.split("-");
  return parts[2] + "/" + parts[1] + "/" + parts[0];
}

/** يضيف الشرطات أثناء الكتابة: "1509" -> "15/09" */
function formatWhileTyping(text) {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
}

/** "15/09/2026" -> "2026-09-15"، ويرجع "" إذا التاريخ ناقص أو غير صحيح */
function textToIso(text) {
  const digits = text.replace(/\D/g, "");
  if (digits.length !== 8) return "";

  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  const dayNumber = Number(day);
  const monthNumber = Number(month);
  const yearNumber = Number(year);

  if (monthNumber < 1 || monthNumber > 12) return "";
  if (dayNumber < 1 || dayNumber > 31) return "";
  if (yearNumber < 2000 || yearNumber > 2100) return "";

  // تحقق أن اليوم موجود فعلاً في هذا الشهر (مثلاً 31/02 غير صحيح)
  const date = new Date(year + "-" + month + "-" + day + "T00:00:00");
  if (date.getMonth() + 1 !== monthNumber || date.getDate() !== dayNumber) {
    return "";
  }

  return year + "-" + month + "-" + day;
}

/**
 * يبني خلايا شبكة الشهر.
 * الخلايا الفاضية (null) في البداية تزيح أول يوم ليقع تحت اسم يومه الصحيح.
 */
function buildMonthCells(year, monthIndex) {
  const firstWeekday = new Date(year, monthIndex, 1).getDay(); // 0 = الأحد
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }
  return cells;
}

export default function DateField({ id, label, value, onChange }) {
  // النص المعروض في الحقل (يوم/شهر/سنة)
  const [text, setText] = useState(isoToText(value));

  // حالة التقويم
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // لو تغيّرت القيمة من الخارج (مثلاً ضغط "مسح") نحدّث النص المعروض.
  // الشرط مهم: بدونه يُمسح ما يكتبه المستخدم قبل ما يكمل التاريخ.
  useEffect(() => {
    if (textToIso(text) !== value) {
      setText(isoToText(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // إغلاق التقويم عند الضغط خارجه أو بزر Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === "Escape") setIsOpen(false);
    }
    function close() {
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    // لو صفّح المستخدم الصفحة يصير التقويم في مكان غلط، فنقفله
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  function handleChange(event) {
    const formatted = formatWhileTyping(event.target.value);
    setText(formatted);
    onChange(textToIso(formatted));
  }

  /**
   * يفتح التقويم.
   * نحسب موقعه بالنسبة للشاشة (position: fixed) لأنه لو كان داخل جدول
   * فيه overflow سيُقص جزء منه.
   */
  function openCalendar() {
    const rect = inputRef.current.getBoundingClientRect();
    const calendarWidth = 268;

    let left = rect.left;
    if (left + calendarWidth > window.innerWidth - 8) {
      left = window.innerWidth - calendarWidth - 8;
    }
    if (left < 8) left = 8;

    setPosition({ top: rect.bottom + 6, left: left });

    // افتح التقويم على شهر التاريخ المختار، وإلا على الشهر الحالي
    const selected = value ? new Date(value + "T00:00:00") : new Date();
    setViewYear(selected.getFullYear());
    setViewMonth(selected.getMonth());

    setIsOpen(true);
  }

  function pickDay(day) {
    const iso = viewYear + "-" + pad(viewMonth + 1) + "-" + pad(day);
    setText(isoToText(iso));
    onChange(iso);
    setIsOpen(false);
  }

  function goToPreviousMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  // تاريخ مكتمل الأرقام لكنه غير صحيح (مثل 31/02/2026)
  const isInvalid = text.replace(/\D/g, "").length === 8 && !textToIso(text);

  const today = new Date();
  const todayIso =
    today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());

  const cells = buildMonthCells(viewYear, viewMonth);

  return (
    <div className="field" ref={wrapperRef}>
      {label ? <label htmlFor={id}>{label}</label> : null}

      <div className="date-input">
        <input
          id={id}
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          placeholder="يوم/شهر/سنة"
          maxLength={10}
          value={text}
          onChange={handleChange}
          className={isInvalid ? "invalid" : ""}
        />
        <button
          type="button"
          className="calendar-toggle"
          onClick={openCalendar}
          aria-label="افتح التقويم"
          title="افتح التقويم"
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="1.5" y="3" width="13" height="11.5" rx="2"
                  stroke="currentColor" strokeWidth="1.3" />
            <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3" />
            <path d="M5 1.5v3M11 1.5v3" stroke="currentColor"
                  strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {isInvalid && <span className="field-error">تاريخ غير صحيح</span>}

      {/* ===== التقويم ===== */}
      {isOpen && (
        <div
          className="calendar"
          style={{ top: position.top + "px", left: position.left + "px" }}
        >
          <div className="calendar-head">
            <button type="button" onClick={goToPreviousMonth} aria-label="الشهر السابق">
              ›
            </button>
            <span className="calendar-title">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={goToNextMonth} aria-label="الشهر التالي">
              ‹
            </button>
          </div>

          <div className="calendar-grid calendar-weekdays">
            {WEEKDAY_NAMES.map((name) => (
              <span key={name}>{name}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {cells.map((day, index) => {
              if (day === null) {
                return <span key={"empty-" + index} />;
              }

              const iso = viewYear + "-" + pad(viewMonth + 1) + "-" + pad(day);
              const classNames = ["calendar-day"];
              if (iso === value) classNames.push("selected");
              if (iso === todayIso) classNames.push("today");

              return (
                <button
                  type="button"
                  key={iso}
                  className={classNames.join(" ")}
                  onClick={() => pickDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="calendar-foot">
            <button
              type="button"
              className="small secondary"
              onClick={() => {
                setText(isoToText(todayIso));
                onChange(todayIso);
                setIsOpen(false);
              }}
            >
              اليوم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

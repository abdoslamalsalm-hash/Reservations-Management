// دوال صغيرة لتنسيق العرض

/** 6500 -> "6,500.00" */
export function formatMoney(value) {
  const number = Number(value || 0);
  return number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "2026-09-15" -> "15/09/2026" */
export function formatDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

/** أسماء أيام الأسبوع — الفهرس يطابق getDay()‎: 0 = الأحد */
const WEEKDAY_NAMES = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

/**
 * الليالي التي يزيد فيها الطلب على الشاليهات.
 * 4 = الخميس، 5 = الجمعة. غيّر الأرقام هنا فقط لو تختلف عندك.
 */
const PEAK_DAYS = [4, 5];

/** "2026-09-16" -> "الخميس" */
export function formatWeekday(isoDate) {
  if (!isoDate) return "";
  return WEEKDAY_NAMES[new Date(isoDate + "T00:00:00").getDay()];
}

/** هل هذا التاريخ من ليالي نهاية الأسبوع؟ */
export function isPeakDay(isoDate) {
  if (!isoDate) return false;
  return PEAK_DAYS.includes(new Date(isoDate + "T00:00:00").getDay());
}

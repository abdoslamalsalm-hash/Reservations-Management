/**
 * حفظ كلمة المرور في المتصفح بعد تسجيل الدخول.
 *
 * localStorage تبقى بعد إغلاق المتصفح، فما تحتاج تسجّل دخول كل مرة.
 * لو تبيها تنتهي عند إغلاق المتصفح، بدّل localStorage بـ sessionStorage
 * في الدوال الثلاث أدناه.
 *
 * كل عملية ملفوفة بـ try/catch لأن المتصفح قد يمنع التخزين
 * (نافذة تصفح خفي، أو إعدادات صارمة) فيرمي استثناء.
 */

const STORAGE_KEY = "devora-auth";

export function getToken() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) || "";
  } catch (e) {
    return "";
  }
}

export function setToken(value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch (e) {
    // نتجاهل: المستخدم يبقى مسجّلًا في هذي الصفحة فقط
  }
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // نتجاهل
  }
}

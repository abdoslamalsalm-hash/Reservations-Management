// كل الاتصالات مع الـ Backend في هذا الملف، عشان لو تغيّر العنوان نغيّره في مكان واحد.

import { getToken, clearToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

/**
 * يضيف ترويسة كلمة المرور لكل طلب.
 * الـ Backend يرفض أي طلب بدونها (شوف AuthFilter.java).
 */
function withAuth(headers) {
  const result = { ...(headers || {}) };
  const token = getToken();
  if (token) {
    result["X-App-Password"] = token;
  }
  return result;
}

/** يقرأ الرد ويرمي خطأ واضح إذا كان فيه مشكلة */
async function readResponse(response) {
  // 401 = كلمة المرور غلط أو انتهت الجلسة -> نرجّع المستخدم لصفحة الدخول
  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("انتهت الجلسة. سجّل الدخول مرة ثانية.");
  }

  if (!response.ok) {
    let message = "تعذّر الاتصال بالخادم. تأكد أن الـ Backend يعمل على المنفذ 8080.";
    try {
      const data = await response.json();
      if (data && data.error) {
        message = data.error;
      }
    } catch (e) {
      // الرد ليس JSON، نستخدم الرسالة الافتراضية
    }
    throw new Error(message);
  }

  // 204 No Content (حالة الحذف) ما فيها body
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/** يبني جزء الاستعلام ?from=...&to=... ويتجاهل القيم الفاضية */
function buildQuery(params) {
  const query = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

/** ملخص الشاليهات الستة + الإجمالي العام */
export async function getSummary(from, to) {
  const response = await fetch(`${API_URL}/summary${buildQuery({ from, to })}`, {
    cache: "no-store",
    headers: withAuth(),
  });
  return readResponse(response);
}

/** الفترات المحاسبية (13 من الشهر إلى 12 من الشهر التالي) وإجمالي كل فترة */
export async function getPeriods() {
  const response = await fetch(`${API_URL}/periods`, {
    cache: "no-store",
    headers: withAuth(),
  });
  return readResponse(response);
}

/** حجوزات شاليه معيّن */
export async function getBookings(chaletId, from, to) {
  const response = await fetch(
    `${API_URL}/bookings${buildQuery({ chaletId, from, to })}`,
    { cache: "no-store", headers: withAuth() }
  );
  return readResponse(response);
}

/** إضافة حجز جديد */
export async function addBooking(chaletId, date, price, guestName, notes) {
  const response = await fetch(`${API_URL}/bookings`, {
    method: "POST",
    headers: withAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      chaletId: Number(chaletId),
      date: date,
      price: Number(price),
      guestName: guestName,
      notes: notes,
    }),
  });
  return readResponse(response);
}

/** تعديل حجز موجود */
export async function updateBooking(id, chaletId, date, price, guestName, notes) {
  const response = await fetch(`${API_URL}/bookings/${id}`, {
    method: "PUT",
    headers: withAuth({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      chaletId: Number(chaletId),
      date: date,
      price: Number(price),
      guestName: guestName,
      notes: notes,
    }),
  });
  return readResponse(response);
}

/** حذف حجز */
export async function deleteBooking(id) {
  const response = await fetch(`${API_URL}/bookings/${id}`, {
    method: "DELETE",
    headers: withAuth(),
  });
  return readResponse(response);
}

/**
 * تحقق من كلمة المرور.
 * هذا المسار الوحيد المفتوح بدون ترويسة، لأنه هو اللي يتحقق منها.
 */
export async function login(password) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (response.status === 401) {
    throw new Error("كلمة المرور غير صحيحة");
  }
  if (!response.ok) {
    throw new Error("تعذّر الاتصال بالخادم. تأكد أنه يعمل.");
  }
  return response.json();
}

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

/**
 * حارس الصفحات.
 *
 * يلفّ كل محتوى التطبيق: إذا ما فيه كلمة مرور محفوظة يحوّلك لصفحة الدخول.
 * صفحة /login نفسها مستثناة وإلا صارت حلقة لا تنتهي.
 *
 * ملاحظة: هذا حارس واجهة فقط — يخفي الشاشات لكنه ليس الحماية الحقيقية.
 * الحماية الفعلية في الـ Backend (AuthFilter) الذي يرفض أي طلب بلا ترويسة،
 * فحتى لو تجاوز أحد هذي الصفحة لن يحصل على أي بيانات.
 */
export default function AuthGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // نبدأ بـ false عشان ما نعرض المحتوى للحظة قبل التحويل
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (pathname === "/login") {
      setAllowed(true);
      return;
    }

    if (!getToken()) {
      setAllowed(false);
      router.replace("/login");
      return;
    }

    setAllowed(true);
  }, [pathname, router]);

  if (!allowed) return null;

  return children;
}

"use client";

import { usePathname } from "next/navigation";
import Nav from "./Nav";

/**
 * هيدر الموقع.
 *
 * نخفيه كاملًا في صفحة تسجيل الدخول: هناك الشعار والاسم موجودان داخل
 * بطاقة الدخول نفسها، فبقاء الهيدر يكررهما ويشتّت الانتباه عن الحقل الوحيد
 * المطلوب من المستخدم.
 */
export default function SiteHeader() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="/" className="brand">
          {/* الشعار موجود في frontend/public/logo.png */}
          <img src="/logo.png" alt="شعار شاليهات ديفورا" width="42" height="42" />
          <span className="brand-text">
            <span className="brand-ar">شاليهات ديفورا</span>
            <span className="brand-en">Devora Chalets</span>
          </span>
        </a>

        <Nav />
      </div>
    </header>
  );
}

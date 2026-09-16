"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/auth";

/**
 * شريط التنقل في الهيدر.
 *
 * usePathname يرجّع مسار الصفحة الحالية، ونستخدمه لتمييز الرابط النشط.
 * ولأنه hook فالمكوّن لازم يكون Client Component، ولهذا فصلناه عن layout.js.
 */
const LINKS = [
  { href: "/", label: "لوحة التحكم" },
  { href: "/periods", label: "مقارنة كل الفترات" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  // ما نعرض الشريط في صفحة تسجيل الدخول
  if (pathname === "/login") return null;

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <nav className="site-nav">
      {LINKS.map((link) => {
        // "/" نشط فقط في الصفحة الرئيسية وصفحات الشاليهات
        const isActive =
          link.href === "/"
            ? pathname === "/" || pathname.startsWith("/chalet")
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={isActive ? "nav-link active" : "nav-link"}
          >
            {link.label}
          </Link>
        );
      })}

      <button type="button" className="nav-logout" onClick={handleLogout}>
        خروج
      </button>
    </nav>
  );
}

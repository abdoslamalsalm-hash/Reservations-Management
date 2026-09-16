import "./globals.css";
import SiteHeader from "./components/SiteHeader";
import AuthGuard from "./components/AuthGuard";

export const metadata = {
  title: "شاليهات ديفورا — الإيرادات",
  description: "إدارة أسعار وإيرادات شاليهات ديفورا",
};

/**
 * القالب العام لكل الصفحات.
 * dir="rtl" يجعل اتجاه الصفحة كلها من اليمين لليسار.
 *
 * SiteHeader و AuthGuard كلاهما Client Component لأنهما يحتاجان معرفة
 * الصفحة الحالية (usePathname)، ولهذا فُصلا عن هذا الملف.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <SiteHeader />
        <main className="container">
          <AuthGuard>{children}</AuthGuard>
        </main>
      </body>
    </html>
  );
}

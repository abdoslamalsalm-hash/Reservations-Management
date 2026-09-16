"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import { setToken } from "@/lib/auth";

/**
 * صفحة تسجيل الدخول.
 *
 * ترسل كلمة المرور إلى /api/login، وإذا صحّت تحفظها في المتصفح
 * وتنقلك للوحة التحكم. بعدها كل طلب يحمل الكلمة في ترويسته.
 */
export default function LoginPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!password) {
      setError("اكتب كلمة المرور");
      return;
    }

    setChecking(true);
    try {
      await login(password);
      setToken(password);
      router.replace("/");
    } catch (e) {
      setError(e.message);
      setPassword("");
      setChecking(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>

        {/* ===== الهوية ===== */}
        <div className="login-head">
          <img
            src="/logo.png"
            alt="شعار شاليهات ديفورا"
            width="76"
            height="76"
          />
          <div className="login-names">
            <span className="login-name-ar">شاليهات ديفورا</span>
            <span className="login-name-en">Devora Chalets</span>
          </div>
        </div>

        <div className="login-divider" />

        <p className="login-lead">نظام إدارة الحجوزات والإيرادات</p>

        {error && (
          <div className="message error login-error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.4" />
              <path d="M8 4.8v3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11" r=".85" fill="currentColor" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* ===== كلمة المرور ===== */}
        <div className="field">
          <label htmlFor="password">كلمة المرور</label>

          <div className="password-input">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={error ? "invalid" : ""}
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              title={showPassword ? "إخفاء" : "إظهار"}
            >
              {showPassword ? (
                /* عين مشطوبة */
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M3.2 3.2l13.6 13.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M7.4 7.5A2.6 2.6 0 0 0 10 12.6c.7 0 1.3-.3 1.8-.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M6 6.1C3.9 7.2 2.4 8.9 1.8 10c1.3 2.4 4.5 4.8 8.2 4.8 1.4 0 2.7-.3 3.9-.9M16 13.1c1.1-.8 2-1.9 2.4-3.1-1.3-2.4-4.5-4.8-8.2-4.8-.6 0-1.2.1-1.8.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              ) : (
                /* عين */
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M1.8 10C3.1 7.6 6.3 5.2 10 5.2s6.9 2.4 8.2 4.8c-1.3 2.4-4.5 4.8-8.2 4.8S3.1 12.4 1.8 10Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button type="submit" disabled={checking} className="login-button">
          {checking ? "جارٍ التحقق..." : "دخول"}
        </button>
      </form>

      <p className="login-foot">للاستخدام الداخلي — إدارة شاليهات ديفورا</p>
    </div>
  );
}

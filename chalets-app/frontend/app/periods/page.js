"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPeriods } from "@/lib/api";
import { formatMoney, formatDate } from "@/lib/format";

/**
 * صفحة مقارنة الفترات.
 * تعرض كل فترة محاسبية (13 → 12) وإجماليها، مع شريط يوضح الفرق بينها بصريًا.
 */
export default function PeriodsPage() {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setPeriods(await getPeriods());
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // أعلى إجمالي — نستخدمه لحساب طول الشريط في كل صف
  const highest = periods.reduce(
    (max, period) => Math.max(max, Number(period.total)),
    0
  );

  const grandTotal = periods.reduce(
    (sum, period) => sum + Number(period.total),
    0
  );

  const totalBookings = periods.reduce(
    (sum, period) => sum + period.bookings,
    0
  );

  return (
    <div>
      <Link href="/" className="back-link">
        رجوع للوحة التحكم ←
      </Link>

      <h1>مقارنة الفترات</h1>
      <p className="subtitle">
        كل فترة تبدأ يوم 13 وتنتهي يوم 12 من الشهر التالي
      </p>

      {error && <div className="message error">{error}</div>}

      {loading && <p className="empty">جارٍ التحميل...</p>}

      {!loading && periods.length > 0 && (
        <div className="table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الفترة</th>
                  <th>من</th>
                  <th>إلى</th>
                  <th>الحجوزات</th>
                  <th>الإجمالي</th>
                  <th className="bar-col"></th>
                </tr>
              </thead>

              <tbody>
                {periods.map((period) => (
                  <tr key={period.start}>
                    <td>
                      {period.label}
                      {period.current && <span className="chip">الحالية</span>}
                      {period.upcoming && <span className="chip">القادمة</span>}
                    </td>
                    <td className="num">{formatDate(period.start)}</td>
                    <td className="num">{formatDate(period.end)}</td>
                    <td className="num">{period.bookings}</td>
                    <td className="num strong">
                      {formatMoney(period.total)} ريال
                    </td>
                    <td className="bar-col">
                      <span
                        className="bar"
                        style={{
                          width:
                            highest > 0
                              ? (Number(period.total) / highest) * 100 + "%"
                              : "0%",
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td>المجموع</td>
                  <td></td>
                  <td></td>
                  <td className="num">{totalBookings}</td>
                  <td className="num">{formatMoney(grandTotal)} ريال</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

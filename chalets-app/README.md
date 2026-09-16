# شاليهات ديفورا — نظام بسيط لإدارة الأسعار والإيرادات

تطبيق Monolithic بسيط: تسجّل حجز (شاليه + تاريخ + سعر)، والنظام يحسب لك المجاميع.
بدون تسجيل دخول، بدون دفع، بدون Docker، بدون Microservices.

---

## 1. الـ Architecture

ثلاث طبقات مستقلة تتكلم مع بعض عبر REST API:

```
┌──────────────────────┐        HTTP / JSON        ┌──────────────────────┐        JDBC        ┌──────────────┐
│   Frontend           │  ───────────────────────► │   Backend            │  ───────────────►  │  PostgreSQL  │
│   Next.js            │                           │   Spring Boot        │                    │  chalets_db  │
│   localhost:3000     │  ◄─────────────────────── │   localhost:8080     │  ◄───────────────  │  :5432       │
└──────────────────────┘                           └──────────────────────┘                    └──────────────┘
```

### داخل الـ Backend (ترتيب الطبقات)

```
Controller  ← يستقبل الـ HTTP request ويرجع JSON
    ↓
Service     ← المنطق: حساب المجاميع، الفلترة، التحقق
    ↓
Repository  ← يتكلم مع قاعدة البيانات (Spring Data JPA)
    ↓
Entity      ← يمثّل جدول bookings
```

لماذا هذا الترتيب؟ كل طبقة مسؤولية واحدة. لو أردت لاحقًا تغيير قاعدة البيانات
تغيّر الـ Repository فقط، والـ Controller ما يتأثر.

---

## 2. قاعدة البيانات

جدول واحد فقط:

**bookings**

| العمود        | النوع            | الوصف                          |
|---------------|------------------|--------------------------------|
| `id`          | BIGSERIAL (PK)   | معرّف تلقائي                    |
| `chalet_id`   | INTEGER NOT NULL | رقم الشاليه: من 1 إلى 6         |
| `booking_date`| DATE NOT NULL    | تاريخ الحجز                     |
| `price`       | NUMERIC(12,2)    | السعر بالريال                   |
| `guest_name`  | VARCHAR(100)     | اسم الحاجز (مطلوب عند الإضافة)  |
| `notes`       | VARCHAR(500)     | ملاحظات اختيارية                |
| `deleted`     | BOOLEAN          | حذف ناعم — الصف يبقى ويختفي فقط |

**ليش ما فيه جدول للشاليهات؟**
عددها ثابت (6) وأسماؤها مجرد `شاليه 1 ... شاليه 6`، فما فيه داعي لجدول إضافي.
الاسم يُبنى في الـ Service: `"شاليه " + chaletId`.

**ليش `booking_date` وليس `date`؟** لأن `date` كلمة محجوزة في SQL.

**ليش `NUMERIC` وليس `double`؟** لأن `double` يسبب أخطاء تقريب في المبالغ المالية.

الجدول يُنشأ تلقائيًا أول تشغيل بفضل `spring.jpa.hibernate.ddl-auto=update`.

---

## 3. الـ REST API

| Method | Endpoint                                        | الوظيفة                              |
|--------|-------------------------------------------------|--------------------------------------|
| GET    | `/api/summary`                                  | ملخص الشاليهات الستة + الإجمالي العام |
| GET    | `/api/summary?from=2026-09-13&to=2026-10-13`    | نفس الشيء لكن داخل فترة محددة        |
| GET    | `/api/periods`                                  | الفترات المحاسبية وإجمالي كل فترة     |
| GET    | `/api/bookings?chaletId=1`                      | حجوزات شاليه معيّن                   |
| POST   | `/api/bookings`                                 | إضافة حجز                            |
| PUT    | `/api/bookings/{id}`                            | تعديل حجز (التاريخ أو السعر)          |
| DELETE | `/api/bookings/{id}`                            | حذف حجز                              |

صيغة التاريخ في الـ API هي `yyyy-MM-dd` (المعيار الدولي).
في الواجهة تكتب التاريخ بالأرقام فقط: تكتب `15092026` والحقل يحوّلها إلى `15/09/2026`،
والمكوّن `DateField` يحوّلها إلى `2026-09-15` قبل إرسالها.

### مثال إضافة حجز

```json
POST /api/bookings
{
  "chaletId": 1,
  "date": "2026-09-15",
  "price": 500,
  "guestName": "أبو خالد",
  "notes": "دفع عربون 200"
}
```

`guestName` مطلوب، و `notes` اختياري. العمودان يقبلان NULL في الجدول
عشان الحجوزات القديمة المسجّلة قبل إضافتهما تبقى صالحة.

### مثال رد الملخص

```json
{
  "chalets": [
    { "chaletId": 1, "name": "شاليه 1", "total": 6500.00, "bookings": 12 },
    { "chaletId": 2, "name": "شاليه 2", "total": 4200.00, "bookings": 8 }
  ],
  "grandTotal": 28000.00,
  "totalBookings": 52
}
```

---

## 4. هيكل الملفات

```
chalets-app/
├── backend/                                  ← Spring Boot
│   ├── pom.xml                               ← المكتبات المستخدمة
│   └── src/main/
│       ├── java/com/example/chalets/
│       │   ├── ChaletsApplication.java       ← نقطة التشغيل (main)
│       │   ├── model/Booking.java            ← جدول bookings
│       │   ├── repository/BookingRepository.java
│       │   ├── service/BookingService.java   ← حساب المجاميع والفلترة
│       │   ├── controller/BookingController.java
│       │   ├── dto/                          ← أشكال الـ JSON الداخل والخارج
│       │   │   ├── BookingRequest.java
│       │   │   ├── BookingResponse.java
│       │   │   ├── ChaletSummary.java
│       │   │   └── DashboardResponse.java
│       │   └── config/
│       │       ├── WebConfig.java            ← السماح للواجهة بالاتصال (CORS)
│       │       └── ApiExceptionHandler.java  ← رسائل خطأ واضحة
│       └── resources/application.properties  ← إعدادات قاعدة البيانات
│
└── frontend/                                 ← Next.js
    ├── package.json
    ├── .env.local                            ← عنوان الـ Backend
    ├── public/
    │   ├── logo.png                          ← شعار الشاليهات (يظهر في الهيدر)
    │   └── logo-full.png                     ← الشعار الكامل بالدائرة
    ├── lib/
    │   ├── api.js                            ← كل نداءات الـ API
    │   └── format.js                         ← تنسيق الأرقام والتواريخ
    └── app/
        ├── layout.js                         ← القالب العام (RTL + الهيدر)
        ├── globals.css                       ← التنسيقات وألوان الشعار
        ├── page.js                           ← لوحة التحكم (الكروت + الفلترة)
        ├── components/DateField.js           ← حقل تاريخ: تقويم + كتابة بالأرقام
        ├── periods/page.js                   ← مقارنة الفترات المحاسبية
        └── chalet/[id]/page.js               ← صفحة الشاليه (الجدول + إضافة/تعديل/حذف)
```

---

## 5. التشغيل

### المتطلبات

- JDK 17 أو أحدث
- Maven (أو افتح مجلد `backend` في IntelliJ وهو يتكفّل)
- Node.js 18 أو أحدث
- PostgreSQL

### أ) إنشاء قاعدة البيانات

```bash
psql -U postgres -c "CREATE DATABASE chalets_db;"
```

إذا كان اليوزر أو الباسورد عندك مختلفًا، عدّلهما في:
`backend/src/main/resources/application.properties`

### ب) تشغيل الـ Backend

```bash
cd backend
mvn spring-boot:run
```

يشتغل على http://localhost:8080
للتأكد: افتح http://localhost:8080/api/summary — المفروض يرجع JSON بأصفار.

> بديل: افتح مجلد `backend` في IntelliJ، وشغّل `ChaletsApplication.java` مباشرة.

### ج) تشغيل الـ Frontend

في نافذة طرفية ثانية:

```bash
cd frontend
npm install
npm run dev
```

افتح http://localhost:3000

---

## 6. كيف يشتغل؟

1. **لوحة التحكم** تنادي `GET /api/summary` وتعرض 6 كروت.
2. **اضغط على أي كارت** → تنتقل إلى `/chalet/1` التي تنادي `GET /api/bookings?chaletId=1`.
3. **زر إضافة حجز** يفتح فورم (تاريخ + سعر) ويرسل `POST /api/bookings`،
   وبعد النجاح يُعاد تحميل الجدول ويتحدّث الإجمالي تلقائيًا.
4. **زر تعديل** في كل صف يحوّل الصف إلى حقول تحرير ويرسل `PUT /api/bookings/{id}` عند الحفظ.
5. **زر حذف** يطلب تأكيدًا داخل الصف نفسه ثم يرسل `DELETE /api/bookings/{id}`.
6. **الفلترة بالتاريخ** في لوحة التحكم ترسل `from` و `to`،
   والـ Service يحسب المجاميع على الحجوزات داخل الفترة فقط (شاملة الطرفين).

## الفترات المحاسبية

الشهر عندنا **يبدأ يوم 13 وينتهي يوم 12 من الشهر التالي**، لا من 1 إلى 30.

مثال: الفترة `13/09/2026 → 12/10/2026`. يوم 13 أكتوبر يدخل في الفترة التالية،
فلا يوجد حجز يُحسب في فترتين.

المنطق كله في `BookingService`:

```java
public static final int PERIOD_START_DAY = 13;

public static LocalDate periodStartFor(LocalDate date) {
    if (date.getDayOfMonth() >= PERIOD_START_DAY) {
        return date.withDayOfMonth(PERIOD_START_DAY);   // 2026-09-20 -> 2026-09-13
    }
    return date.minusMonths(1).withDayOfMonth(PERIOD_START_DAY);  // 2026-09-05 -> 2026-08-13
}
```

لتغيير يوم البداية (مثلاً إلى 1) غيّر `PERIOD_START_DAY` فقط — وكل شيء يتبعه.

لوحة التحكم تفتح على الفترة الحالية، وفيها قائمة لاختيار أي فترة،
وصفحة `/periods` تعرض كل الفترات وإجمالي كل واحدة للمقارنة.

## الحماية

النظام محمي بكلمة مرور واحدة مشتركة.

| الطبقة | الملف | وظيفته |
|---|---|---|
| Backend | `config/AuthFilter.java` | يرفض أي طلب على `/api/**` بلا ترويسة `X-App-Password` |
| Backend | `controller/AuthController.java` | `POST /api/login` للتحقق من الكلمة |
| Frontend | `app/login/page.js` | صفحة الدخول |
| Frontend | `lib/auth.js` | حفظ الكلمة في `localStorage` |
| Frontend | `components/AuthGuard.js` | يحوّل أي زائر غير مسجّل إلى `/login` |

كلمة المرور تُقرأ من متغيّر `APP_PASSWORD`. محليًا القيمة الافتراضية `local-dev`. بعد النشر تُضبط كلمة قوية في Render ولا تُكتب في الكود أبدًا.

**ما الذي تحميه وما الذي لا تحميه:** تمنع الغرباء من فتح النظام. لكنها كلمة
واحدة للجميع، فلا يمكن معرفة من أضاف أو حذف حجزًا. لو احتجت ذلك لاحقًا
نضيف جدول مستخدمين وعمود «من سجّل» في جدول الحجوزات.

`AuthGuard` حارس واجهة فقط — الحماية الحقيقية في `AuthFilter`، فحتى لو تجاوز
أحد صفحة الدخول لن يحصل على أي بيانات من الـ API.

## النشر

كل الإعدادات تُقرأ من متغيّرات بيئة، فما تحتاج تعدّل أي ملف عند النشر.

### المتغيّرات

**Backend (Render):**

| المتغيّر | القيمة |
|---|---|
| `DATABASE_URL` | رابط Neon بصيغة JDBC |
| `DB_USERNAME` | مستخدم Neon |
| `DB_PASSWORD` | كلمة مرور Neon |
| `APP_PASSWORD` | كلمة دخول النظام (اخترها قوية) |
| `CORS_ORIGIN` | رابط Vercel، مثال `https://devora.vercel.app` |
| `SHOW_SQL` | `false` |

**Frontend (Vercel):**

| المتغيّر | القيمة |
|---|---|
| `NEXT_PUBLIC_API_URL` | رابط Render + `/api`، مثال `https://devora-api.onrender.com/api` |

### ملاحظات

- `backend/Dockerfile` موجود لأن Render لا يدعم Java مباشرة — يُنشر كـ Docker.
- خذ قاعدة البيانات من **Neon** لا من Render: قاعدة Render المجانية تُحذف بعد 30 يومًا.
- الخطة المجانية في Render تُنيم الخدمة بعد 15 دقيقة خمول، فأول فتحة بعدها تأخذ نحو دقيقة.

## واجهة عربية

الواجهة كلها بالعربي واتجاه الصفحة من اليمين (`dir="rtl"` في `layout.js`).
الكود نفسه (أسماء المتغيّرات والدوال) بقي بالإنجليزي كما هو متعارف عليه،
والتعليقات بالعربي.

---

## 7. بيانات تجريبية (اختياري)

لو تبغى تجرّب بسرعة بدون إدخال يدوي:

```sql
INSERT INTO bookings (chalet_id, booking_date, price) VALUES
  (1, '2026-09-15', 500), (1, '2026-09-16', 700), (1, '2026-09-20', 500),
  (2, '2026-09-15', 600), (2, '2026-09-22', 800),
  (3, '2026-10-01', 900), (3, '2026-10-02', 900),
  (4, '2026-09-18', 450),
  (5, '2026-10-05', 750), (5, '2026-10-06', 750),
  (6, '2026-09-30', 400);
```

شغّلها بعد أول تشغيل للـ Backend (عشان يكون الجدول موجودًا):

```bash
psql -U postgres -d chalets_db -f seed.sql
```

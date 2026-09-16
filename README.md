# Devora Chalets — Revenue Management System

A full-stack revenue tracking system for a 6-unit chalet business, **in daily production use by the property's management team**.

Staff record a booking (chalet, date, price, guest, notes) and the system aggregates revenue per chalet and per accounting period. Built as a deliberately simple monolith: one table, one REST API, no microservices, no over-engineering.

**Stack:** Spring Boot 3 · PostgreSQL · Next.js 14 · Docker
**Deployed on:** Vercel (frontend) · Render (API, containerized) · Neon (managed PostgreSQL)

---

## Architecture

```
┌──────────────────┐   HTTP / JSON    ┌──────────────────┐      JDBC      ┌──────────────┐
│  Next.js 14      │ ───────────────► │  Spring Boot 3   │ ─────────────► │  PostgreSQL  │
│  App Router      │ ◄─────────────── │  REST API        │ ◄───────────── │  (Neon)      │
│  Arabic, RTL     │                  │  Docker / Render │                │              │
└──────────────────┘                  └──────────────────┘                └──────────────┘
```

The backend is layered, one responsibility per layer:

```
Controller  →  HTTP handling, request/response DTOs
Service     →  business logic: aggregation, period math, validation
Repository  →  Spring Data JPA queries
Entity      →  the bookings table
```

Swapping the datastore touches the repository layer only; controllers are unaffected.

## Engineering decisions worth noting

**Custom accounting period (13th → 12th).** The business does not close its books on calendar months — a period runs from the 13th of one month to the 12th of the next. All period math derives from a single constant, so changing the boundary is a one-line change:

```java
public static final int PERIOD_START_DAY = 13;

public static LocalDate periodStartFor(LocalDate date) {
    if (date.getDayOfMonth() >= PERIOD_START_DAY) {
        return date.withDayOfMonth(PERIOD_START_DAY);
    }
    return date.minusMonths(1).withDayOfMonth(PERIOD_START_DAY);
}
```

Boundaries are half-open, so no booking is ever counted in two periods.

**`NUMERIC(12,2)` for money, never `double`.** Floating point introduces rounding drift in financial totals.

**Soft delete.** Bookings carry a `deleted` flag rather than being removed, so a mistaken deletion is recoverable and historical totals stay auditable.

**No `chalets` table.** The unit count is fixed at six with no attributes of their own; a lookup table would add a join for no information. The display name is derived in the service layer.

**Configuration entirely through environment variables.** Every setting reads `${VAR:local-default}`, so the same artifact runs locally and in production with no file edits and no secrets in source control.

**Defense at the API, not the UI.** A servlet filter rejects any `/api/**` request without a valid `X-App-Password` header. The frontend route guard is a convenience; bypassing it yields no data.

## REST API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/summary` | Per-chalet totals and grand total |
| `GET` | `/api/summary?from=2026-09-13&to=2026-10-13` | Same, scoped to a date range |
| `GET` | `/api/periods` | All accounting periods with their totals |
| `GET` | `/api/bookings?chaletId=1` | Bookings for one chalet |
| `POST` | `/api/bookings` | Create a booking |
| `PUT` | `/api/bookings/{id}` | Update date or price |
| `DELETE` | `/api/bookings/{id}` | Soft-delete a booking |
| `POST` | `/api/login` | Validate the shared access password |

Dates are ISO `yyyy-MM-dd` throughout the API.

```json
POST /api/bookings
{ "chaletId": 1, "date": "2026-09-15", "price": 500, "guestName": "...", "notes": "..." }
```

```json
GET /api/summary
{
  "chalets": [
    { "chaletId": 1, "name": "...", "total": 6500.00, "bookings": 12 }
  ],
  "grandTotal": 28000.00,
  "totalBookings": 52
}
```

## Data model

A single table. Everything else is derived.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `BIGSERIAL` | Primary key |
| `chalet_id` | `INTEGER NOT NULL` | 1–6 |
| `booking_date` | `DATE NOT NULL` | Named `booking_date`; `date` is an SQL reserved word |
| `price` | `NUMERIC(12,2)` | Exact decimal |
| `guest_name` | `VARCHAR(100)` | Nullable, so rows predating the column stay valid |
| `notes` | `VARCHAR(500)` | Optional |
| `deleted` | `BOOLEAN` | Soft-delete flag |

## Running locally

Requires JDK 17+, Node 18+, PostgreSQL 14+.

```bash
# 1. Database (the schema is created on first boot by JPA)
createdb chalets_db

# 2. API — http://localhost:8080
cd chalets-app/backend
./mvnw spring-boot:run

# 3. Frontend — http://localhost:3000
cd chalets-app/frontend
cp .env.example .env.local
npm install
npm run dev
```

Optional sample data: `psql -d chalets_db -f chalets-app/seed.sql`

## Configuration

**Backend**

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | JDBC connection string |
| `DB_USERNAME` / `DB_PASSWORD` | Database credentials |
| `APP_PASSWORD` | Shared access password |
| `CORS_ORIGIN` | Allowed frontend origin |
| `SHOW_SQL` | SQL logging, `false` in production |
| `PORT` | Injected by the host |

**Frontend**

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | API base URL, e.g. `https://<host>/api` |

The API ships with a `Dockerfile` and deploys to Render as a container.

## Frontend

Next.js 14 App Router, fully Arabic with `dir="rtl"`. The dashboard opens on the current accounting period with a selector for any other; `/periods` compares all periods side by side. Date entry accepts digits only (`15092026`) and normalizes to ISO before the request. Identifiers and code are in English; UI copy is Arabic.

## Scope

Intentionally not a booking platform: no customer accounts, no payment processing, no availability calendar. It replaced a spreadsheet, and the goal was for the totals to be correct and the data entry to take seconds on a phone.

---

Detailed design documentation, in Arabic: [`chalets-app/README.md`](chalets-app/README.md)

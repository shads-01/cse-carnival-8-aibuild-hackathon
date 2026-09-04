# Arko — Backend & Data Layer (v4)

Deadline: **8:30 PM, 4 September**. Full detail: [`tasks.md`](./tasks.md) · [`PLAN.md`](./PLAN.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md)

> **v4 changes:** repo structure is `server/` (not `backend/`), routes under `/api/v1/`;
> auth = Supabase Auth (not custom JWT); new systems = room booking approval flow +
> notifications table; `.env.example` has merge conflict that blocks everyone — fix first.

You own: Supabase schema, seed script, `server/src/services/*.ts`, REST API, auth setup.
Nobody else touches these files.

## Pre-flight fixes (BLOCKING — do first)

- [ ] **`.env.example` merge conflict** — two halves collided (`<<<<<<< HEAD ... >>>>>>>`).
      Merge into one file with ALL keys: `PORT=5000`, `NODE_ENV=development`,
      `CLIENT_URL=http://localhost:5173`, `JWT_SECRET` (keep as fallback),
      `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`,
      `GEMINI_API_KEY`, `VITE_API_BASE_URL=http://localhost:5000/api/v1`,
      `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] **Supabase Auth** — enable in Supabase console:
      - Email OTP (for signup verification)
      - Google OAuth provider (for "Sign in with Google")
      - Password reset emails
      - Configure redirect URLs for local dev (`http://localhost:5173`)
- [ ] **Auth middleware update** — `server/src/middlewares/auth.ts` should validate
      Supabase Auth JWT sessions (not just the custom JWT). Keep custom JWT as fallback.

## Setup (with the other two, ~15 min)

- [ ] Confirm DB schema: 7 tables + notifications (see below)
- [ ] Confirm all REST endpoints are under `/api/v1/*`
- [ ] Share `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_ANON_KEY`
- [ ] Confirm agent tool contract (9 tools — see `tasks.md`)

## Your build

### Schema & Seed
- [ ] `schema.sql` — 8 tables + FKs:
      - `schedules`, `rooms`, `bookings` (with `status: pending|confirmed|rejected|cancelled`
        and `requester_id`), `events`, `event_registrations`, `announcements`, `assignments`
      - **NEW:** `notifications` — `id, user_id, type, title, body, link, read, created_at`
- [ ] `seed.ts` — load `data/*.json`, split embedded `bookings`/`registrations` into join
      tables, upsert on `id` (safe to re-run)

### Services (the ONLY layer that talks to Supabase)
- [ ] `services/scheduleService.ts` — full CRUD
- [ ] `services/roomService.ts` — CRUD + `findAvailable()`, `book()` (creates booking with
      `status: 'pending'` or `'confirmed'` if admin), `cancelBooking()`
- [ ] `services/eventService.ts` — CRUD + `register()` (capacity check), `cancelRegistration()`
- [ ] `services/announcementService.ts` — full CRUD
- [ ] `services/assignmentService.ts` — full CRUD
- [ ] **`services/requestService.ts`** — **NEW:** get pending bookings, approve (→ `confirmed`
      + create notification for requester, re-check conflict at approve time), reject
      (→ `rejected` + notification with reason)
- [ ] **`services/notificationService.ts`** — **NEW:** create, getByUser, markRead, markAllRead

### Routes (thin controllers, all under `/api/v1/`)
- [ ] `routes/schedules.ts` — GET/POST/PUT/DELETE
- [ ] `routes/rooms.ts` — GET/POST/PUT/DELETE + `POST /:id/book`, `DELETE /bookings/:id`
- [ ] `routes/events.ts` — GET/POST/PUT/DELETE + `POST /:id/register`, `DELETE /registrations/:id`
- [ ] `routes/announcements.ts` — GET/POST/PUT/DELETE
- [ ] `routes/assignments.ts` — GET/POST/PUT/DELETE
- [ ] **`routes/requests.ts`** — **NEW:** `GET /requests`, `POST /requests/:id/approve`,
      `POST /requests/:id/reject`
- [ ] **`routes/notifications.ts`** — **NEW:** `GET /notifications`, `PUT /notifications/:id/read`,
      `PUT /notifications/read-all`

### Booking overlap + capacity checks
- [ ] Booking overlap check lives in `roomService.book()` — `WHERE room_id = ? AND date = ?
      AND start_time < ? AND end_time > ? AND status IN ('pending', 'confirmed')`
- [ ] Event capacity check lives in `eventService.register()` — count registrations vs capacity
- [ ] Both return structured errors (not exceptions) so the agent gets clean signals

## Non-negotiable rule

All data access — dashboard and agent alike — goes through your `services/*.ts`. Never let
a route handler or the agent hit Supabase directly. This is what makes "agent reads live data"
true by construction.

## Verify before integration

- [ ] Curl/Postman every endpoint against seeded data
- [ ] Supabase Auth: test login, signup (OTP), Google OAuth, password reset via Postman
- [ ] Booking conflict: try to book an overlapping slot → get a clean error
- [ ] Event capacity: register when full → get a clean error
- [ ] Approve/reject flow: approve a pending booking → verify status changes + notification created

## Integration (last ~30 min, all 3 together)

Shads and Hrittika swap their mocks for your real API/services — the one point where the
three tracks touch.

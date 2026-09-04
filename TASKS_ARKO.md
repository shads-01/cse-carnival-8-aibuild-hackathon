# Arko — Backend & Data Layer (v4)

Deadline: **8:30 PM, 4 September**. Full detail: [`tasks.md`](./tasks.md) · [`PLAN.md`](./PLAN.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md)

> **v4 changes:** repo structure is `server/src/` (npm workspace), routes under `/api/v1/`
> via controllers; auth = Supabase Auth (with custom JWT fallback); new systems = room
> booking approval flow (`requestService`) + notifications table (`notificationService`).
> When you finish a checklist item below, check it **and** strike it through: `- [x] ~~item~~`.

You own: Supabase schema, seed script, `server/src/services/*.ts`, REST controllers & routes, auth setup.
Nobody else touches these files.

## Pre-flight fixes (BLOCKING — do first)

- [ ] **`.env.example`** — merge into one file with ALL keys: `PORT=5000`, `NODE_ENV=development`,
      `CLIENT_URL=http://localhost:5173`, `JWT_SECRET` (keep as fallback),
      `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`,
      `GEMINI_API_KEYS`, `VITE_API_BASE_URL=http://localhost:5000/api/v1`,
      `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] **Supabase Auth** — enable in Supabase console:
      - Email OTP (for signup verification)
      - Google OAuth provider (for "Sign in with Google")
      - Password reset emails
      - Configure redirect URLs for local dev (`http://localhost:5173`)
- [ ] **Auth middleware update** — `server/src/middlewares/auth.ts` should validate
      Supabase Auth JWT sessions (not just the custom JWT). Keep custom JWT as fallback.

## Setup (with the other two, ~15 min)

- [x] ~~Agree DB schema: 7 tables + FKs~~ — see `schema/schema.md`, applied to Supabase
- [ ] Add `notifications` table schema: `id, user_id, type, title, body, link, read, created_at`
- [x] ~~Confirm all REST endpoints are under `/api/v1/*`~~
- [x] ~~Share `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + `SUPABASE_ANON_KEY`~~
- [x] ~~Confirm agent tool contract (9 tools — see `tasks.md`)~~

## Your build

### Schema & Seed
- [x] ~~`server/src/db/schema.sql` — 7 tables + FKs: `schedules`, `rooms`, `bookings`, `events`, `event_registrations`, `announcements`, `assignments`~~ — drafted, applied to Supabase, verified live
- [ ] `schema.sql` update — add `notifications` table and `status`/`requester_id` to `bookings`
- [x] ~~`server/src/db/seed.ts` — load `data/*.json`, split embedded `bookings`/`registrations` arrays into join tables, upsert on `id` (safe to re-run)~~

### Services (the ONLY layer that talks to Supabase)
- [x] ~~`server/src/services/scheduleService.ts`~~ — full CRUD, filtering by course/day/room/instructor/section
- [x] ~~`server/src/services/roomService.ts` — + `findAvailable()`, `book()`, `cancelBooking()` (overlap check lives here)~~
- [x] ~~`server/src/services/eventService.ts` — + `register()`, `cancelRegistration()` (capacity check lives here)~~
- [x] ~~`server/src/services/announcementService.ts`~~ — full CRUD, priority & expiration filtering
- [x] ~~`server/src/services/assignmentService.ts`~~ — full CRUD, deadline & status filtering
- [ ] `server/src/services/requestService.ts` — **NEW:** get pending bookings, approve (→ `confirmed` + create notification for requester, re-check conflict at approve time), reject (→ `rejected` + notification with reason)
- [ ] `server/src/services/notificationService.ts` — **NEW:** create, getByUser, markRead, markAllRead

### Controllers & Routes (thin controllers over services, all under `/api/v1/`)
- [x] ~~Express scaffold: `app.ts`/`server.ts`, CORS, JSON body parsing, error middleware~~ — already exists from the workspace push
- [x] ~~`server/src/routes/v1/schedule.routes.ts` + `schedule.controller.ts` — GET/POST/PUT/DELETE~~
- [x] ~~`server/src/routes/v1/room.routes.ts` + `room.controller.ts` — GET/POST/PUT/DELETE + `POST /:id/book`, `DELETE /bookings/:id`~~
- [x] ~~`server/src/routes/v1/event.routes.ts` + `event.controller.ts` — GET/POST/PUT/DELETE + `POST /:id/register`, `DELETE /registrations/:id`~~
- [x] ~~`server/src/routes/v1/announcement.routes.ts` + `announcement.controller.ts` — GET/POST/PUT/DELETE~~
- [x] ~~`server/src/routes/v1/assignment.routes.ts` + `assignment.controller.ts` — GET/POST/PUT/DELETE~~
- [ ] `server/src/routes/v1/request.routes.ts` + `request.controller.ts` — **NEW:** `GET /requests`, `POST /requests/:id/approve`, `POST /requests/:id/reject`
- [ ] `server/src/routes/v1/notification.routes.ts` + `notification.controller.ts` — **NEW:** `GET /notifications`, `PUT /notifications/:id/read`, `PUT /notifications/read-all`

### Booking overlap + capacity checks
- [x] ~~Booking overlap check lives in `roomService.book()` — `WHERE room_id = ? AND date = ? AND start_time < ? AND end_time > ? AND status IN ('pending', 'confirmed')`~~
- [x] ~~Event capacity check lives in `eventService.register()` — count registrations vs capacity~~
- [x] ~~Both return structured errors (not exceptions) so the agent gets clean signals~~

## Non-negotiable rule

All data access — dashboard and agent alike — goes through your `services/*.ts`. Never let
a route handler or the agent hit Supabase directly. This is what makes "agent reads live data"
true by construction.

## Verify before integration

- [x] ~~Curl/Postman/automated test suite against seeded data (Automated Vitest integration test suite passing 35/35 tests)~~
- [ ] Supabase Auth: test login, signup (OTP), Google OAuth, password reset via Postman
- [ ] Booking conflict: try to book an overlapping slot → get a clean error
- [ ] Event capacity: register when full → get a clean error
- [ ] Approve/reject flow: approve a pending booking → verify status changes + notification created

## Integration (last ~30 min, all 3 together)

Shads and Hrittika swap their mocks for your real API/services — the one point where the
three tracks touch.

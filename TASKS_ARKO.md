# Arko — Backend & Data Layer

Deadline: **8:30 PM, 4 September**. Full detail: [`tasks.md`](./tasks.md) · [`PLAN.md`](./PLAN.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md)

> When you finish a checklist item below, check it **and** strike it through: `- [x] ~~item~~`.

You own: Supabase schema, seed script, `services/*.ts`, REST API. Nobody else touches these files.

> **2026-09-04 update:** everything below now lives under `server/src/` (npm workspace), not
> a standalone `backend/` — `db/schema.sql` has already moved there. `ARCHITECTURE.md`'s
> [Target directory layout](./ARCHITECTURE.md#target-directory-layout) is the source of truth,
> and it adds one layer versus the plan below: routes now go through a `*.controller.ts`
> before calling your services, not directly.

## Setup (do first, ~15 min, with the other two)
- [ ] Agree the DB schema (7 tables), REST endpoint shapes, and agent tool signatures — see `schema/schema.md`
- [ ] Create the Supabase project → share `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` with Shads and Hrittika (never commit real keys)
- [x] ~~Fill out `.env.example` with final key names (incl. `GEMINI_API_KEY` for Hrittika's track)~~

## Your build
- [x] ~~`server/src/db/schema.sql` — 7 tables + FKs: `schedules`, `rooms`, `bookings`, `events`, `event_registrations`, `announcements`, `assignments`~~ — drafted by Hrittika, applied to Supabase, verified live, moved into `server/` 2026-09-04
- [ ] `server/src/db/seed.ts` — load `data/*.json`, split embedded `bookings`/`registrations` arrays into join tables, upsert on `id` (safe to re-run)
- [ ] `server/src/services/scheduleService.ts`
- [ ] `server/src/services/roomService.ts` — + `findAvailable()`, `book()`, `cancelBooking()` (overlap check lives here)
- [ ] `server/src/services/eventService.ts` — + `register()`, `cancelRegistration()` (capacity check lives here)
- [ ] `server/src/services/announcementService.ts`
- [ ] `server/src/services/assignmentService.ts`
- [ ] `server/src/routes/v1/schedule.routes.ts`, `room.routes.ts`, `event.routes.ts`, `announcement.routes.ts`, `assignment.routes.ts` + matching `server/src/controllers/*.controller.ts` — thin routers + controllers over services, full CRUD on all 5
- [x] ~~Express scaffold: `app.ts`/`server.ts`, CORS, JSON body parsing, error middleware~~ — already exists from the workspace push, reuse as-is

## Non-negotiable rule
All data access — dashboard and agent alike — goes through your `services/*.ts`. Never let a route or the agent hit Supabase directly.

## Verify before integration
Curl/Postman every endpoint against seeded data.

## Integration (last ~30 min, all 3 together)
Shads and Hrittika swap their mocks for your real API/services — the one point where the three tracks touch.

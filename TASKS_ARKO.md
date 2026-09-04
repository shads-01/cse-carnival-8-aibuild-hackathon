# Arko — Backend & Data Layer

Deadline: **8:30 PM, 4 September**. Full detail: [`tasks.md`](./tasks.md) · [`PLAN.md`](./PLAN.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md)

> When you finish a checklist item below, check it **and** strike it through: `- [x] ~~item~~`.

You own: Supabase schema, seed script, `services/*.ts`, REST API. Nobody else touches these files.

## Setup (do first, ~15 min, with the other two)
- [x] ~~Agree the DB schema (7 tables), REST endpoint shapes, and agent tool signatures — see `schema/schema.md`~~
- [x] ~~Create the Supabase project → share `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` with Shads and Hrittika (never commit real keys)~~
- [x] ~~Fill out `.env.example` with final key names (incl. `GEMINI_API_KEY` for Hrittika's track)~~

## Your build
- [x] ~~`db/schema.sql` — 7 tables + FKs: `schedules`, `rooms`, `bookings`, `events`, `event_registrations`, `announcements`, `assignments`~~ — drafted by Hrittika, applied to Supabase, verified live
- [x] ~~`db/seed.ts` — load `data/*.json`, split embedded `bookings`/`registrations` arrays into join tables, upsert on `id` (safe to re-run)~~
- [x] ~~`services/scheduleService.ts`~~ — full CRUD, filtering by course/day/room/instructor/section
- [x] ~~`services/roomService.ts` — + `findAvailable()`, `book()`, `cancelBooking()` (overlap check lives here)~~
- [x] ~~`services/eventService.ts` — + `register()`, `cancelRegistration()` (capacity check lives here)~~
- [x] ~~`services/announcementService.ts`~~ — full CRUD, priority & expiration filtering
- [x] ~~`services/assignmentService.ts`~~ — full CRUD, deadline & status filtering
- [x] ~~`routes/schedules.ts`, `rooms.ts`, `events.ts`, `announcements.ts`, `assignments.ts` — thin controllers over services, full CRUD on all 5~~
- [x] ~~Express scaffold: `index.ts`, CORS, JSON body parsing, error middleware~~

## Non-negotiable rule
All data access — dashboard and agent alike — goes through your `services/*.ts`. Never let a route or the agent hit Supabase directly.

## Verify before integration
- [x] ~~Curl/Postman every endpoint against seeded data.~~ (Automated Vitest integration test suite passing 24/24 tests)

## Integration (last ~30 min, all 3 together)
Shads and Hrittika swap their mocks for your real API/services — the one point where the three tracks touch.

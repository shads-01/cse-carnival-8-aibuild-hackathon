# CampusOS — System Architecture

This is the durable reference for how CampusOS is built and why. Read [`AGENTS.md`](./AGENTS.md)
first for the fastest orientation; read this file when you need the full picture — data model,
API surface, agent tool contracts, and how a request actually flows end to end. Rationale and
the time-boxed build order live in [`PLAN.md`](./PLAN.md); the graded spec is
[`PROBLEM_STATEMENT.md`](./PROBLEM_STATEMENT.md).

---

## Status as of this writing — READ THIS FIRST

**The directory layout changed today (2026-09-04) — read this before trusting an older
mental model of this repo.** The original plan called for `backend/` + `frontend/`. What
actually landed is an **npm-workspaces monorepo**: `client/` + `server/` + `shared/`, rooted
at a workspace `package.json`. This document now describes *that* layout as the target —
see [Open decisions / risks](#open-decisions--risks) for why the switch happened and what it
cost.

What exists today:

```
client/     React 18 + Vite + TypeScript workspace — scaffolded with generic auth/user
            boilerplate (login, JWT, Zustand authStore) that predates the CampusOS domain.
            The five real sections (schedules/rooms/events/announcements/assignments) are
            not built yet — see Build phases.
server/     Express + TypeScript workspace — same story: generic auth/user
            controllers/services/routes are scaffolded; server/src/db/schema.sql is the one
            piece that's already the real CampusOS schema (7 tables, moved here from a
            since-removed backend/ directory today). services/*.ts for the 5 domains and
            agent/ do not exist yet.
shared/     Cross-workspace TypeScript types/constants (@shared/types) — currently only
            user/auth/HTTP-status types; will need Schedule/Room/Event/Announcement/
            Assignment types added as those domains get built.
data/       5 seed JSON files (schedules, rooms, events, announcements, assignments)
schema/schema.md         field-level schema reference for the 5 systems
sample_queries/          the exact queries judges will run against the agent
AGENTS.md, CLAUDE.md,    planning + convention docs (this file included)
PLAN.md, tasks.md
```

Everything else in this document describing `client/src/`, `server/src/services/*.ts`,
`server/src/agent/*.ts` etc. is the **target architecture** for the CampusOS domain — most
of it is not yet written. If you're an agent picking this up cold: the workspace scaffold
and the DB schema exist; the five services, the REST routes for them, and the agent do not.
See [Build phases](#build-phases--current-status) for exactly what's done and what's next,
and [`tasks.md`](./tasks.md) for who owns which track.

---

## One-paragraph overview

CampusOS is two things sharing one backend: a dashboard where students/staff view and fully
manage five campus data systems (schedules, rooms, events, announcements, assignments), and
a chat agent that answers questions and takes actions (book a room, register for an event)
using real LLM tool calling against that same live data. The one rule that makes the whole
thing hang together: **dashboard routes and agent tools both read and write through the same
`services/*.ts` layer** — never Supabase directly from either side. That's what makes "the
agent always has the latest data" true by construction instead of something that has to be
remembered.

---

## Team ownership (parallel build, zero blocking dependencies)

Three people, three tracks, one 15-minute shared contract up front. Full detail in
[`tasks.md`](./tasks.md).

| Track | Owner | Scope |
|---|---|---|
| Backend & Data | Arko | Supabase schema (done — `server/src/db/schema.sql`), seed script, `server/src/services/*.ts`, `server/src/routes/v1/*.ts` |
| Dashboard UI | Shads | React CRUD UI for all 5 systems in `client/`, builds against mocked data until Arko's API is live |
| AI Agent | Hrittika | Tool calling, Gemini integration, chat UI in `server/src/agent/` + `client/`, builds against stubbed tool responses until Arko's services are live |

Shads and Hrittika don't wait on Arko — they build against the agreed contract (schema,
endpoint shapes, tool signatures) with mocks, then swap to the real API/services as the one
integration point.

**One exception, introduced by adopting the `shared/` workspace (see [Open decisions](#open-decisions--risks)):**
`server/` and `client/` both import domain types from `@shared/types`, which today only has
user/auth types — no `Schedule`/`Room`/`Booking`/`Event`/`EventRegistration`/`Announcement`/
`Assignment`. Whoever confirms the schema should add those to `shared/src/types/` immediately
after — see `tasks.md`'s Shared contract checklist. Until they land, real (non-mocked)
`server/`/`client/` code has nothing to import them from, which is the one place "zero
blocking dependencies" doesn't fully hold anymore.

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | Express + TypeScript, in the `server/` workspace | Layered: `routes/v1/*.ts` (thin Express routers + Zod validation) → `*.controller.ts` (parse req, call service, format response) → `services/*.ts` (the only layer touching Supabase — see [The one architecture rule](#the-one-architecture-rule-that-matters)). |
| Frontend | React 18 (Vite) + TypeScript, in the `client/` workspace | Zustand for state, Axios (`client/src/services/api.ts`) for HTTP, hand-rolled CSS design tokens (`index.css`) — not Tailwind/shadcn as originally planned; superseded by what's already scaffolded, see [Open decisions](#open-decisions--risks). |
| Shared types | `shared/` workspace (`@shared/types`) | Cross-stack TypeScript types/constants shared by `client` and `server` via npm workspaces — no duplicated DTOs between the two. |
| State freshness | Zustand domain stores, wrapping `client/src/services/*.ts` | Each domain (`rooms`, `events`, …) gets a store with a `fetch()` action; `ChatPanel.tsx` calls the matching store's `fetch()` after a mutating agent response, so the dashboard updates with no manual reload. See [Request lifecycle](#request-lifecycle--a-full-trace) step 9. |
| Database | Supabase (Postgres) | Accessed **only** from the Express backend (`server/src/config/supabase.ts`) via the **Supabase service-role key**. Frontend never talks to Supabase with that key — its own `supabaseClient.ts` only ever holds the anon key. |
| LLM | **Google Gemini** (`gemini-2.5-flash` or `gemini-2.5-pro`), native function calling via the **Google GenAI SDK** (`@google/genai`, `tools`/`functionDeclarations`) | Isolated behind `server/src/agent/llmClient.ts` so swapping providers later is a ~15-line change, not a rewrite. |

> **Decision note:** confirmed 2026-09-04 — **the LLM provider is Gemini**, matching
> `PLAN.md`, `tasks.md`, and the Hrittika track. If you're an agent and see any doc (including
> a stale editor buffer or an older session's context) saying Claude/Anthropic for the agent
> LLM, that's wrong — this file and the current `CLAUDE.md`/`AGENTS.md` are the source of
> truth, and they all agree on Gemini.

---

## The one architecture rule that matters

**Every data access — dashboard CRUD and agent tool calls alike — goes through the same
`server/src/services/*.ts` layer.** Never let `server/src/agent/tools.ts` query Supabase
directly, and never let a controller skip the service layer "just this once."

```
┌────────────────────────┐              ┌───────────────┐
│    React Dashboard     │              │ Chat / Agent  │
│ client/ (full CRUD UI) │              │ ChatPanel.tsx │
└────────────────────────┘              └───────────────┘
             │                                  │
             ▼ Axios (client/src/services/*.ts) ▼ POST /api/v1/agent/chat
┌─────────────────────────┐              ┌───────────────────┐
│     routes/v1/*.ts      │              │  agent/tools.ts   │
│  thin Express routers   │              │  9 tool handlers  │
│ Zod validate.middleware │              │ no business logic │
└─────────────────────────┘              └───────────────────┘
             │                                     │
┌──────────────────────────┐                       │
│     *.controller.ts      │                       │
│ parse req, call service, │                       │
│  format via apiResponse  │                       │
└──────────────────────────┘                       │
              │                                    │
              └───────────────────┬────────────────┘
         both terminate in the SAME services/*.ts functions
                                  ▼
          ┌──────────────────────────────────────────────┐
          │                services/*.ts                 │
          │ scheduleService · roomService · eventService │
          │   announcementService · assignmentService    │
          │          — single source of truth —          │
          │     the ONLY code that reaches Postgres      │
          └──────────────────────────────────────────────┘
                                  │ supabase-js (service-role key)
                                  ▼
                  ┌──────────────────────────────┐
                  │     Supabase (Postgres)      │
                  │ schedules · rooms · bookings │
                  │ events · event_registrations │
                  │ announcements · assignments  │
                  └──────────────────────────────┘
```

All of this lives under `server/src/`. Both entry points — the dashboard's
`routes/v1/*.ts` → `*.controller.ts` chain and the agent's `agent/tools.ts` — terminate in
the *same* `services/*.ts` functions before anything reaches Postgres. The controller layer
is new versus the original two-hop plan (it didn't exist when `routes/*.ts` called services
directly); it's still not allowed a shortcut around `services/*.ts`, and neither is the
agent. That's the whole rule, drawn as a diagram instead of stated as a sentence.

Why this is non-negotiable rather than a style preference: "always using the latest data" is
worth 10 of the 40 agent marks, graded directly by editing a record in the dashboard and then
asking the agent about it in the same session. Two code paths to the database means two places
that can drift out of sync — one service layer means there is structurally nothing to drift.

If you're adding a new data operation: it belongs in a service function first, then gets
called from a route and/or a tool. Never written twice.

---

## Data model

Normalized Postgres tables (not JSONB blobs) so booking-conflict and capacity queries are
cheap `WHERE` clauses, not app-level array scanning. Mirrors [`schema/schema.md`](./schema/schema.md)
with two seed-data arrays (`rooms[].bookings`, `events[].registrations`) split into their own
tables — 7 tables total.

```
┌─ schedules ───────────────────────┐      ┌─ rooms ─────────────────────────────────┐      ┌─ events ───────────────────────────────┐
│ id            text PK             │      │ id            text PK                   │      │ id            text PK                  │
│ course        text                │      │ room_number   text  unique              │      │ name          text                     │
│ title         text                │      │ type          text                      │      │ description   text  default ''         │
│ day           text                │      │ capacity      int                       │      │ date          date                     │
│ start_time    time                │      │ equipment     text[]                    │      │ end_date      date                     │
│ end_time      time                │      │ floor         int                       │      │ start_time    time                     │
│ room          text                │      │ status        text  default 'available' │      │ end_time      time                     │
│ instructor    text  default 'TBA' │      └─────────────────────────────────────────┘      │ venue         text                     │
│ section       text                │                                                       │ organizer     text                     │
└───────────────────────────────────┘                                                       │ capacity      int                      │
                                                                                            │ status        text  default 'upcoming' │
                                                                                            └────────────────────────────────────────┘
                                                                │                                                │
                                                                ▼ 1..*                                           ▼ 1..*
                                          ┌─ bookings ───────────────────────────────┐     ┌─ event_registrations ────────────────────┐
                                          │ id            text PK                    │     │ id            text PK                    │
                                          │ room_id       text FK -> rooms.id        │     │ event_id      text FK -> events.id       │
                                          │ booked_by     text                       │     │ student_id    text                       │
                                          │ date          date                       │     │ name          text                       │
                                          │ start_time    time                       │     │ registered_at timestamptz  default now() │
                                          │ end_time      time                       │     │ unique(event_id, student_id)             │
                                          │ purpose       text                       │     └──────────────────────────────────────────┘
                                          │ created_at    timestamptz  default now() │
                                          └──────────────────────────────────────────┘

(FK)  bookings.room_id -> rooms.id               one room  : many bookings
(FK)  event_registrations.event_id -> events.id  one event : many registrations

(virtual) events.registered — not a column; served from the events_with_registration_count
          view: SELECT e.*, COUNT(er.id) AS registered FROM events e LEFT JOIN
          event_registrations er ON er.event_id = e.id GROUP BY e.id
```

```
┌─ announcements ───────┐        ┌─ assignments ────────────────────────────────┐
│ id            text PK │        │ id                   text PK                 │
│ title         text    │        │ course               text                    │
│ body          text    │        │ course_title         text                    │
│ date          date    │        │ title                text                    │
│ priority      text    │        │ description          text  default ''        │
│ posted_by     text    │        │ assigned_date        date                    │
│ expires       date    │        │ deadline             date                    │
└───────────────────────┘        │ submission_platform  text                    │
                                 │ status               text  default 'pending' │
                                 │ marks                int                     │
                                 └──────────────────────────────────────────────┘

Stand-alone — no FK relations to the other five tables.
```

All 7 tables live in `server/src/db/schema.sql` (moved there today from a since-removed
`backend/` directory — it's the one piece of the CampusOS domain schema that's already real,
applied to Supabase, and correct as drawn above). IDs are plain `text` slugs (`"room-001"`,
`"asgn-001"`, …) matching the seed JSON in `data/*.json` — not generated `uuid`s.

**One field is deliberately computed, not stored:**
- `events.registered` — never a column on `events`. `schema.sql` defines
  `events_with_registration_count`, a view that joins `event_registrations` and counts per
  event; `eventService` reads through that view instead of hand-rolling the join, and there
  is nothing to increment/decrement or let drift.

Room booking conflicts are checked at write time in `roomService.book()` via
`start_time < existing.end_time AND end_time > existing.start_time` over the `bookings` FK
relation (`idx_bookings_room_date` makes that check cheap), not by scanning a JSON array.

### Time & date conventions (applies to every domain table)

One format per concept, used identically everywhere it appears — in Postgres columns, service
function signatures, REST payloads, and agent tool parameters:

| Concept | Format | Postgres type | Example |
|---|---|---|---|
| Calendar date | `YYYY-MM-DD` (ISO 8601 date) | `date` | `2026-09-05` |
| Clock time | `HH:mm`, 24-hour, campus-local (single time zone — no offset needed) | `time` | `15:00` |
| Internal bookkeeping timestamp (row creation only, never set by a client/agent) | ISO 8601 timestamp | `timestamptz` | `2026-09-04T14:32:00Z` |

Every domain-facing date/time field — including `assignments.deadline` — is a plain `date` or
`time`, because schedules, bookings, events, and assignment deadlines are always campus-local
calendar dates, never compared across days at sub-day precision. The only `timestamptz`
columns in the schema are `bookings.created_at` and `event_registrations.registered_at` —
server-set audit timestamps, never a value a tool call or REST payload provides.

Seed script (`server/src/db/seed.ts`, not yet written) will read the five files in `data/`,
transform the embedded `bookings`/`registrations` arrays into rows in the two join tables, and
upsert on `id` — safe to re-run without duplicating rows.

---

## Target directory layout

npm workspaces, root `package.json` lists `["shared", "server", "client"]`. Root commands:
`npm install` (all three), `npm run dev` (server + client concurrently), `npm run build`
(shared → server → client, in that order — client depends on `shared`'s build output).

Bold entries below are new work for the CampusOS domain — everything else already exists in
the repo as generic auth/user scaffolding (see [Status](#status-as-of-this-writing--read-this-first)
and [Open decisions](#open-decisions--risks) for why that scaffolding doesn't map onto the
five real systems and won't be extended further).

```
shared/
└─ src/
   ├─ types/
   │  ├─ user.types.ts, auth.types.ts, api.types.ts     existing — ApiResponse<T> is reused as-is
   │  └─ **campus.types.ts**                            NEW — Schedule, Room, Booking, Event,
   │                                                     EventRegistration, Announcement, Assignment
   ├─ constants/
   │  ├─ httpStatus.ts, roles.ts, routes.ts             existing
   └─ index.ts                     exports everything above for `@shared/types` imports

server/
└─ src/
   ├─ app.ts                       existing — Express setup: Cors, Helmet, Morgan, JSON parsing,
   │                                routes, 404 handler, error middleware. Mount the 5 new v1
   │                                routers here alongside the existing user/auth/health ones.
   ├─ config/
   │  ├─ index.ts                  existing — Zod-validated env loader; validates
   │  │                            GEMINI_API_KEYS (comma-separated, one or more keys)
   │  └─ supabase.ts                existing — service-role Supabase client, reused as-is
   ├─ db/
   │  ├─ schema.sql                DONE — 7 tables + events_with_registration_count view (moved
   │  │                            here today; see Data model)
   │  └─ **seed.ts**                NEW — loads data/*.json, splits embedded bookings/
   │                                registrations into join-table rows, upserts on id
   ├─ services/                    the ONLY layer that talks to Supabase — see architecture rule
   │  ├─ user.service.ts, auth.service.ts               existing, untouched
   │  └─ **scheduleService.ts, roomService.ts** (+ findAvailable/book/cancelBooking),
   │     **eventService.ts** (+ register/cancelRegistration), **announcementService.ts,
   │     assignmentService.ts**                          NEW
   ├─ controllers/
   │  ├─ user.controller.ts, auth.controller.ts, health.controller.ts   existing
   │  └─ **schedule.controller.ts, room.controller.ts, event.controller.ts,
   │     announcement.controller.ts, assignment.controller.ts, agent.controller.ts**   NEW
   ├─ routes/
   │  ├─ index.ts, v1/index.ts     existing — mount new v1 routers here
   │  ├─ v1/user.routes.ts, v1/auth.routes.ts            existing
   │  └─ **v1/schedule.routes.ts, v1/room.routes.ts, v1/event.routes.ts,
   │     v1/announcement.routes.ts, v1/assignment.routes.ts, v1/agent.routes.ts**   NEW
   ├─ middlewares/
   │  ├─ auth.middleware.ts, validate.middleware.ts, error.middleware.ts   existing, reused as-is
   │  │                            (`validate.middleware.ts` + Zod schemas is how the 5 new
   │  │                            routers validate request shape — reuse, don't reinvent)
   ├─ validators/
   │  ├─ user.validator.ts, auth.validator.ts            existing
   │  └─ **schedule.validator.ts, room.validator.ts, event.validator.ts,
   │     announcement.validator.ts, assignment.validator.ts**   NEW (Zod schemas)
   ├─ utils/
   │  ├─ apiResponse.ts, logger.ts, asyncHandler.ts       existing, reused as-is
   └─ **agent/**                    NEW
      ├─ tools.ts                  9 tool schemas + handlers, call services/* — never Supabase directly
      ├─ systemPrompt.ts           identity + the 4 behavior rules (see below) + injected current date/time
      ├─ llmClient.ts              Google GenAI SDK wrapper (@google/genai), swappable — see AGENTS.md
      └─ runAgent.ts               the tool-use loop: prompt → Gemini → tool call → tools.ts → Gemini → reply

client/
└─ src/
   ├─ App.tsx, main.tsx            existing — app shell; add the 5 sections + ChatPanel here
   ├─ pages/
   │  ├─ Home.tsx, Login.tsx, Dashboard.tsx              existing (Dashboard.tsx currently renders
   │  │                            user-list content — repoint it at the 5 CampusOS sections)
   ├─ features/
   │  ├─ auth/, user/, dashboard/  existing, untouched
   │  └─ **campus/**                NEW —
   │     **ScheduleSection.tsx, RoomSection.tsx** (+ book/cancel UI), **EventSection.tsx**
   │     (+ register/cancel UI), **AnnouncementSection.tsx, AssignmentSection.tsx, ChatPanel.tsx**
   │     (message list + input, calls `/api/v1/agent/chat`, triggers a domain store refetch on `mutated`)
   ├─ services/
   │  ├─ api.ts                    existing — Axios instance, base URL + interceptors, reused as-is
   │  ├─ authService.ts, userService.ts                  existing
   │  └─ **campusService.ts**       NEW — typed functions calling `/api/v1/{schedules,rooms,events,
   │                                announcements,assignments,agent}` through `api.ts`
   ├─ store/
   │  ├─ authStore.ts               existing (Zustand)
   │  └─ **campusStore.ts**         NEW — Zustand store, one slice per domain resource
   │                                (`rooms`, `events`, …) each with a `fetch()` action; this is
   │                                what `ChatPanel.tsx` calls into for freshness (see Request
   │                                lifecycle step 9)
   ├─ components/common/, components/layout/             existing UI primitives — Button, Input,
   │                                Card, Modal, Navbar, Sidebar, Footer — reuse for the 5 new
   │                                sections rather than introducing Tailwind/shadcn
   ├─ hooks/
   │  ├─ useAuth.ts                 existing
   │  └─ useFetch.ts                existing generic hook — fine for one-off reads; use
   │                                `campusStore` instead wherever another component needs to
   │                                see the same refetch
   └─ routes/
      └─ AppRoutes.tsx              existing — add routes for the 5 new sections
```

---

## REST API surface

Standard CRUD on all five systems, plus the two systems with extra actions (rooms, events).
Every path is under `/api/v1` — `server/src/routes/v1/index.ts` already mounts the existing
user/auth/health routers there; the 5 new routers below join them the same way. All routes are
thin — `routes/v1/*.ts` validates the request shape (Zod, via `validate.middleware.ts`) and
hands off to a `*.controller.ts`, which calls straight into `services/*.ts`; business logic
(conflict checks, capacity checks) lives in the service, not in the route or the controller.

| System | Endpoints |
|---|---|
| Schedules | `GET/POST /api/v1/schedules`, `PUT/DELETE /api/v1/schedules/:id` |
| Rooms | `GET/POST /api/v1/rooms`, `PUT/DELETE /api/v1/rooms/:id`, `POST /api/v1/rooms/:id/book`, `POST /api/v1/bookings/:id/cancel` |
| Events | `GET/POST /api/v1/events`, `PUT/DELETE /api/v1/events/:id`, `POST /api/v1/events/:id/register`, `POST /api/v1/events/:id/registrations/:regId/cancel` |
| Announcements | `GET/POST /api/v1/announcements`, `PUT/DELETE /api/v1/announcements/:id` |
| Assignments | `GET/POST /api/v1/assignments`, `PUT/DELETE /api/v1/assignments/:id` |
| Agent | `POST /api/v1/agent/chat` — request `{ message: string, history?: ChatTurn[] }`, response `{ reply: string, mutated: string[] }`. `mutated` names the resource types (`"rooms"`, `"bookings"`, `"events"`, …) any tool call actually wrote in this turn — see [Request lifecycle](#request-lifecycle--a-full-trace) step 9 for how the frontend uses it. |

---

## Agent tool contract

Scope is deliberately **read + the actions the brief actually names** — not full CRUD. The
dashboard already owns full add/edit/delete (Part 1's 20+20 marks); giving the agent the same
surface multiplies untested edge cases (auth, destructive actions) for marks the rubric
doesn't allocate there. If time remains after everything else: `create_announcement` is the
cheapest addition.

Parameter names match the Postgres column names 1:1 (see [Data model](#data-model) and
[Time & date conventions](#time--date-conventions-applies-to-every-domain-table)) —
`start`/`end` never appears as a tool parameter, only `start_time`/`end_time`, so there is
never a translation step between what the agent sends and what `services/*.ts` expects.

| Tool | Parameters | Auth / validation | Calls into |
|---|---|---|---|
| `get_schedule` | `course?: string`, `day?: string` | — | `scheduleService.list()` |
| `get_assignments` | `course?: string`, `status?: string` | — | `assignmentService.list()` |
| `get_events` | `date?: string (YYYY-MM-DD)`, `status?: string` | — | `eventService.list()` |
| `get_announcements` | `priority?: string` | — | `announcementService.list()` |
| `find_available_rooms` | `date: string (YYYY-MM-DD)`, `start_time: string (HH:mm)`, `end_time: string (HH:mm)`, `min_capacity?: number`, `equipment?: string[]` | — | `roomService.findAvailable()` |
| `book_room` | `room_id: string`, `date: string (YYYY-MM-DD)`, `start_time: string (HH:mm)`, `end_time: string (HH:mm)`, `booked_by: string`, `purpose: string` | all 6 required — any missing param triggers rule 2 ("ask, don't guess"), never a silent default | `roomService.book()` |
| `cancel_booking` | `booking_id: string`, `booked_by: string` | `booked_by` must match `bookings.booked_by` on that row; mismatch → refuse under rule 3, don't cancel | `roomService.cancelBooking()` |
| `register_for_event` | `event_id: string`, `student_id: string`, `name: string` | rejected (structured error, not a tool failure) if `events.registered >= events.capacity` | `eventService.register()` |
| `cancel_registration` | `event_id: string`, `student_id: string` | `student_id` must match the `event_registrations` row being cancelled; no match → refuse under rule 3 | `eventService.cancelRegistration()` |

**Tool handlers return structured errors** (`{ error: "..." }`), never a raw thrown exception
into the LLM loop — the agent needs a clean signal to relay ("that room's already booked
then"), not a stack trace.

### System prompt behavior rules

These four rules map directly to the four agent sub-scores (10 marks each):

1. **Never answer from memory.** Always call a read tool first for anything data-shaped, even
   if the answer seems obvious from context.
2. **Ask, don't guess, on a missing required parameter.** *"Just book me any room tomorrow
   afternoon"* → ask which time and how many people. Never silently pick a default.
3. **Refuse when unauthorized or unmatched.** No tool fits the request, or the requester has
   no standing (e.g. cancelling a booking that isn't theirs — no `booked_by`/identity match)
   → refuse and state why. Don't attempt a workaround.
4. **Confirm before destructive/irreversible actions**, restating what will happen. The sample
   queries are mostly direct commands ("Book Room 7A02...") — don't over-confirm the happy
   path, just the ambiguous or destructive cases.

---

## Request lifecycle — a full trace

The clearest way to see why the architecture rule holds up: trace *"Book Room 302 tomorrow, 3
to 5 PM"* from chat message to UI update.

1. **`ChatPanel.tsx`** posts `{ message: "Book Room 302 tomorrow, 3 to 5 PM" }` to
   `POST /api/v1/agent/chat`.
2. **`routes/v1/agent.routes.ts`** → **`agent.controller.ts`** hands it to
   **`agent/runAgent.ts`**. Before the first Gemini call, `runAgent.ts` reads the server clock
   and injects the current campus-local date into the system prompt as a literal line — e.g.
   `Current date: 2026-09-04 (Thursday)` — via `systemPrompt.ts`. This is what lets Gemini
   resolve "tomorrow" into an absolute date server-side; it is never left for the model to
   guess, and it never drifts from the client's clock, because the client's clock is never
   consulted.
3. `runAgent.ts` calls Gemini via **`agent/llmClient.ts`** with that system prompt + the 9 tool
   declarations. Gemini resolves "tomorrow" → `2026-09-05` and "3 to 5 PM" → `15:00`/`17:00`,
   and — forbidden by rule 1 from answering from memory — calls
   `find_available_rooms(date: "2026-09-05", start_time: "15:00", end_time: "17:00")`.
4. **`agent/tools.ts`**'s handler calls `roomService.findAvailable()` — the exact same
   function `room.controller.ts` would call for the dashboard's "available now" filter.
5. `roomService.findAvailable()` queries Supabase directly (it's inside the service layer),
   checking room 302 against the `bookings` table for overlap in that window.
6. Result flows back to Gemini. Room 302 is free → Gemini calls
   `book_room(room_id: "302", date: "2026-09-05", start_time: "15:00", end_time: "17:00",
   booked_by, purpose)`.
7. `roomService.book()` re-checks the overlap (never trust the earlier read as still valid —
   time has passed) and, if still clear, inserts the `bookings` row.
8. Response flows back through `runAgent.ts` → `agent.controller.ts` → `ChatPanel.tsx` as
   `{ reply: "Booked Room 302 for you, 3–5 PM tomorrow.", mutated: ["rooms"] }` — `mutated`
   names which resource types the tool calls in this turn actually wrote.
9. **Freshness on the dashboard side:** `ChatPanel.tsx` sees `mutated: ["rooms"]` and calls
   `useCampusStore.getState().rooms.fetch()` — the Zustand action `RoomSection.tsx` reads its
   list from and calls on its own mount. No manual reload, no polling: the store refetches from
   the same `GET /api/v1/rooms` → `room.controller.ts` → `roomService` path the dashboard
   always uses, and every component subscribed to that slice re-renders.
10. **Freshness check, the actual point of the exercise:** if a judge now opens the dashboard's
    `RoomSection.tsx`, the same `roomService.book()` write is what they'd see — because it's
    the same table, written by the same service function the controller would have called, and
    the store slice pointing at it was just refetched. There is no second copy of the data, no
    cache lag, nothing to go stale.

If step 4 had queried Supabase directly from `agent/tools.ts` instead of through
`roomService`, this trace would still work today — but the day someone adds a second way to
read room availability (a cache, a different query shape), the two paths silently diverge and
the agent starts answering with stale data. That's the failure mode the one architecture rule
exists to make structurally impossible.

---

## Build phases — current status

Mirrors the checklist in [`CLAUDE.md`](./CLAUDE.md) — update both when a phase lands.

| Phase | Output | Status |
|---|---|---|
| 0 — Setup | Supabase project, `.env` filled, `client`/`server`/`shared` workspace scaffold, `schema.sql` applied | **Done** (monorepo workspaces, Supabase schema applied, shared types exported) |
| 1 — Data layer | `server/src/db/seed.ts`, `services/*.ts` for all 5 systems | **Done** (seed script loads 5 systems, all 5 services with conflict checks implemented) |
| 2 — REST API | `routes/v1/*.ts` + `*.controller.ts`, full CRUD on all 5 | **Done** (all 5 routers + controllers mounted under `/api/v1`) |
| 3 — Dashboard UI | 18 pages across Admin, Student, and Auth shells | **Done** (all 18 pages built with Ocean Glass design tokens, responsive 360px–1280px, zero TypeScript errors) |
| 4 — Agent backend | `server/src/agent/tools.ts`, `systemPrompt.ts`, `runAgent.ts`, `POST /api/v1/agent/chat` | **Done, wired to live data** — `tools.ts` now imports the five real `services/*.ts` (Supabase-backed) directly; `stubData.ts`/`types.local.ts` deleted (2026-09-04) per their own "delete once real services land" note, and `types.local.ts`'s DTOs are `@shared/types`' now. `eventService.list()` gained the `date` filter `get_events` needs (it only supported `status`/`venue`/`organizer` before). 44 vitest tests across `agent/*` (5 files) + `services/campusServices.test.ts` all pass; `tools.test.ts` mocks the service layer (mirrors how `runAgent.test.ts` mocks `tools.ts`) rather than hitting Supabase, keeping it fast/offline — `campusServices.test.ts` remains the live Supabase integration test. Live-smoke-tested end-to-end against the real Gemini API + Supabase: `POST /api/v1/agent/chat` with a schedule query returned the actual seeded course list, not fixture data. Note: `gemini-2.5-flash` now 404s ("no longer available to new users") — switched to `gemini-3.6-flash`, which also requires echoing each function-call part's `thoughtSignature` back verbatim (`runAgent.ts` replays `response.candidates[0].content` rather than reconstructing the turn). |
| 5 — Chat UI | `ChatPanel.tsx`, QuickChips, TypingIndicator, ChatBubble | **Done** (integrated into AdminChat and StudentChat pages with `sample_queries.md` chips) |
| 6 — Test against the brief | Every query in `sample_queries/sample_queries.md` + shadow-path cases | Next up |
| 7 — README + polish | Fill required README sections, tidy empty/loading/error states | In progress |

Full time-boxed minute budget per phase is in [`PLAN.md`](./PLAN.md#build-order-time-boxed-against-the-830-pm-deadline).

---

## Environment variables

A single `.env` at the **repo root** (see [`.env.example`](./.env.example), also at the
root) — not `server/.env`. `server/src/config/index.ts` loads and Zod-validates it from
there; `client/` reads its own subset at build time via Vite's `VITE_`-prefixed convention.

| Var | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Backend-only Supabase service-role key — never ship to the client bundle |
| `SUPABASE_ANON_KEY` | optional | Public anon key; mirrored into `VITE_SUPABASE_ANON_KEY` for the client's own `supabaseClient.ts` |
| `GEMINI_API_KEYS` | yes | Comma-separated Google AI Studio key(s), used by `server/src/agent/llmClient.ts` (Google GenAI SDK). One key works; with 2+, `llmClient.ts` automatically rotates to the next key when the current one returns a 429 rate-limit error. |
| `PORT` | no — defaults to `5000` | Express listen port |
| `NODE_ENV`, `CLIENT_URL`, `JWT_SECRET` | no — all default | Pre-existing from the auth scaffold; `config/index.ts` still validates them even though the CampusOS domain doesn't use auth |
| `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | yes, for `client/` | Vite only exposes `VITE_`-prefixed vars to the browser bundle — never put `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEYS` behind this prefix |

Never commit `.env` or real keys — `.env.example` is the template and should only ever
contain placeholders. (It briefly didn't: a prior commit merged in with literal
`<<<<<<< HEAD` conflict markers left in `.env.example` — fixed 2026-09-04. If `cp
.env.example .env` ever produces a file with `<<<<<<<`/`=======`/`>>>>>>>` in it again,
that's this same class of bug — someone committed an unresolved merge, not something to
`cp` as-is.)

---

## Shadow-path coverage (what "handling it well" means in practice)

Per system, applied where it matters most — booking:

- **Nil input** — `book_room` called without `date`/`start_time`/`end_time` → validation error
  the agent surfaces as a clarifying question, never a 500.
- **Empty result** — `find_available_rooms` finds nothing → agent says so plainly, offers to
  relax a constraint, doesn't hallucinate a room.
- **Conflict** — `book_room` on an already-booked window → service layer detects the overlap
  and returns a conflict; agent relays it, doesn't silently double-book.
- **Unauthorized** — cancel/register on a record not tied to the requester's stated identity
  (`booked_by` on `cancel_booking`, `student_id` on `cancel_registration`) → refuse with a
  stated reason.

---

## Open decisions / risks

- **Directory layout — resolved 2026-09-04:** the plan was `backend/` + `frontend/`; what got
  pushed to `main` was an npm-workspaces monorepo (`client/` + `server/` + `shared/`) with
  generic auth/user boilerplate, built independently of Arko's `backend/src/db/schema.sql`
  (the real CampusOS schema). Team decision: **keep `client/server/shared`** — it's already
  real, working infrastructure (Express/Zod/Supabase wiring, error handling, a shared-types
  package) — and build the five CampusOS services/routes/UI *into* it rather than starting a
  second `backend/`+`frontend/` from scratch. `schema.sql` was moved from `backend/` into
  `server/src/db/` today; `backend/` no longer exists. Consequence: `Tailwind/shadcn` and a
  plain `lib/api.ts` fetch wrapper (the original plan) are superseded by what's already
  scaffolded — hand-rolled CSS components and an Axios + Zustand client (updated in
  `TASKS_SHADS.md`, `PLAN.md`, `tasks.md`, `AGENTS.md`, and `CLAUDE.md` the same day). The
  generic auth/user/JWT code that came with the scaffold stays in the repo
  (ripping it out is wasted effort under tonight's clock) but **won't be extended** — it isn't
  named anywhere in `PROBLEM_STATEMENT.md` or the rubric, and none of the five graded systems
  need a login. If you're an agent and encounter a doc that still says `backend/`/`frontend/`,
  treat this file as the source of truth and fix the stale doc.
- **LLM provider — resolved 2026-09-04:** Gemini via the Google GenAI SDK. See the
  [Stack](#stack) section's decision note.
- **Realtime scope — resolved by PLAN.md:** "no manual refresh" is read literally as
  same-client state update from the mutation response (a Zustand domain-store refetch keyed
  off the agent response's `mutated` field — see [Request lifecycle](#request-lifecycle--a-full-trace)
  step 9), not multi-tab broadcast. Supabase Realtime subscriptions are explicitly out of scope
  unless everything else lands early.
- **Agent CRUD scope — resolved by PLAN.md:** agent gets read + book/cancel/register/cancel,
  not full add/edit/delete. Don't widen this without checking the rubric first — it adds edge
  cases without adding marks.
- **Time is the actual constraint**, not any technical unknown — the whole stack is
  intentionally boring and well-trodden. If cutting scope, cut bonus items (deploy, Phase 5b
  multi-tab realtime) before cutting Phase 1–6.

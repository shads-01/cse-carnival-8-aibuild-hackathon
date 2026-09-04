# CampusOS — System Architecture

This is the durable reference for how CampusOS is built and why. Read [`AGENTS.md`](./AGENTS.md)
first for the fastest orientation; read this file when you need the full picture — data model,
API surface, agent tool contracts, and how a request actually flows end to end. Rationale and
the time-boxed build order live in [`PLAN.md`](./PLAN.md); the graded spec is
[`PROBLEM_STATEMENT.md`](./PROBLEM_STATEMENT.md).

---

## Status as of this writing — READ THIS FIRST

**Nothing is scaffolded yet.** There is no `backend/` or `frontend/` directory in this repo.
What exists today:

```
data/                    5 seed JSON files (schedules, rooms, events, announcements, assignments)
schema/schema.md         field-level schema reference for the 5 systems
sample_queries/          the exact queries judges will run against the agent
AGENTS.md, CLAUDE.md,    planning + convention docs (this file included)
PLAN.md, tasks.md
```

Everything else in this document — `backend/src/`, `frontend/src/`, the REST routes, the
service layer, the agent tools — is the **target architecture**, not yet-written code. If
you're an agent picking this up cold: your first job is Phase 0 (scaffold), not editing
files that don't exist. See [Build phases](#build-phases--current-status) for exactly what's
done and what's next, and [`tasks.md`](./tasks.md) for who owns which track.

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
| Backend & Data | Arko | Supabase schema, seed script, `services/*.ts`, REST `routes/*.ts` |
| Dashboard UI | Shads | React CRUD UI for all 5 systems, builds against mocked data until Arko's API is live |
| AI Agent | Hrittika | Tool calling, Gemini integration, chat UI, builds against stubbed tool responses until Arko's services are live |

Shads and Hrittika don't wait on Arko — they build against the agreed contract (schema,
endpoint shapes, tool signatures) with mocks, then swap to the real API/services as the one
integration point.

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | Express + TypeScript | One process, one port; `routes/*.ts` is the Express controller layer — thin, no business logic. |
| Frontend | React (Vite) + TypeScript + Tailwind + shadcn/ui | shadcn buys accessible, polished dialogs/tables/forms without hand-rolled CSS. |
| Data fetching / cache | TanStack Query (`@tanstack/react-query`), wrapping `lib/api.ts` | Gives the dashboard `invalidateQueries` — how it re-renders with fresh data after the agent mutates something, with no manual reload. See [Request lifecycle](#request-lifecycle--a-full-trace) step 9. |
| Database | Supabase (Postgres) | Accessed **only** from the Express backend via the **Supabase service-role key**. Frontend never talks to Supabase directly. |
| LLM | **Google Gemini** (`gemini-2.5-flash` or `gemini-2.5-pro`), native function calling via the **Google GenAI SDK** (`@google/genai`, `tools`/`functionDeclarations`) | Isolated behind `agent/llmClient.ts` so swapping providers later is a ~15-line change, not a rewrite. |

> **Decision note:** confirmed 2026-09-04 — **the LLM provider is Gemini**, matching
> `PLAN.md`, `tasks.md`, and the Hrittika track. If you're an agent and see any doc (including
> a stale editor buffer or an older session's context) saying Claude/Anthropic for the agent
> LLM, that's wrong — this file and the current `CLAUDE.md`/`AGENTS.md` are the source of
> truth, and they all agree on Gemini.

---

## The one architecture rule that matters

**Every data access — dashboard CRUD and agent tool calls alike — goes through the same
`services/*.ts` layer.** Never let `agent/tools.ts` query Supabase directly, and never let a
route handler skip the service layer "just this once."

```
┌─────────────────┐                ┌───────────────┐
│ React Dashboard │                │ Chat / Agent  │
│ (full CRUD UI)  │                │ ChatPanel.tsx │
└─────────────────┘                └───────────────┘
         │ fetch (lib/api.ts)              │ POST /api/agent/chat
         ▼                                 ▼
┌──────────────────┐                ┌───────────────────┐
│   routes/*.ts    │                │  agent/tools.ts   │
│ thin controllers │                │  9 tool handlers  │
│ validate + call  │                │ no business logic │
└──────────────────┘                └───────────────────┘
          │                                   │
          └─────────────────┬─────────────────┘
       both call the SAME services/*.ts functions
                            ▼
    ┌──────────────────────────────────────────────┐
    │                services/*.ts                 │
    │ scheduleService · roomService · eventService │
    │   announcementService · assignmentService    │
    │          — single source of truth —          │
    │      conflict checks, capacity checks:       │
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

Both entry points — the dashboard's `routes/*.ts` (the Express controller layer) and the
agent's `agent/tools.ts` — terminate in the *same* `services/*.ts` functions before anything
reaches Postgres. Neither is allowed a shortcut around that middle layer; that's the whole
rule, drawn as a diagram instead of stated as a sentence.

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
┌─ schedules ───────────┐      ┌─ rooms ───────────────┐      ┌─ events ───────────────────────┐
│ id            uuid PK │      │ id            uuid PK │      │ id            uuid PK          │
│ course        text    │      │ room_number   text    │      │ name          text             │
│ title         text    │      │ type          text    │      │ description   text             │
│ day           text    │      │ capacity      int     │      │ date          date             │
│ start_time    time    │      │ equipment     text[]  │      │ end_date      date  (nullable) │
│ end_time      time    │      │ floor         int     │      │ start_time    time             │
│ room          text    │      │ status        text    │      │ end_time      time             │
│ instructor    text    │      └───────────────────────┘      │ venue         text             │
│ section       text    │                                     │ organizer     text             │
└───────────────────────┘                                     │ capacity      int              │
                                                              │ status        text             │
                                                              └────────────────────────────────┘
                                           │                                   │
                                           ▼ 1..*                              ▼ 1..*
                         ┌─ bookings ────────────────────────┐    ┌─ event_registrations ──────────────┐
                         │ id            uuid PK             │    │ id            uuid PK              │
                         │ room_id       uuid FK -> rooms.id │    │ event_id      uuid FK -> events.id │
                         │ booked_by     text                │    │ student_id    text                 │
                         │ date          date                │    │ name          text                 │
                         │ start_time    time                │    └────────────────────────────────────┘
                         │ end_time      time                │
                         │ purpose       text                │
                         └───────────────────────────────────┘

(FK)  bookings.room_id -> rooms.id               one room  : many bookings
(FK)  event_registrations.event_id -> events.id  one event : many registrations

(virtual) events.registered = COUNT(*) FROM event_registrations WHERE event_id = events.id
          not a stored column — nothing to increment/decrement, nothing to drift
```

```
┌─ announcements ────────────────┐        ┌─ assignments ────────────────────┐
│ id            uuid PK          │        │ id                   uuid PK     │
│ title         text             │        │ course               text        │
│ body          text             │        │ course_title         text        │
│ date          date             │        │ title                text        │
│ priority      text             │        │ description          text        │
│ posted_by     text             │        │ assigned_date        date        │
│ expires       date  (nullable) │        │ deadline             timestamptz │
└────────────────────────────────┘        │ submission_platform  text        │
                                          │ status               text        │
                                          │ marks                int         │
                                          └──────────────────────────────────┘

Stand-alone — no FK relations to the other five tables.
```

**Two fields deliberately become computed, not stored:**
- `events.registered` — a `COUNT(*)` over `event_registrations` where `event_id` matches, not
  a field the app has to remember to increment/decrement. A stored count can drift; a computed
  one can't. It is a **virtual/read-model field** — it appears in API/tool responses but has
  no column in `events`.
- Room booking conflicts — checked at write time in `roomService.book()` via
  `start_time < existing.end_time AND end_time > existing.start_time` over the `bookings` FK
  relation, not by scanning a JSON array.

### Time & date conventions (applies to `bookings`, `schedules`, `events`)

One format per concept, used identically everywhere it appears — in Postgres columns, service
function signatures, REST payloads, and agent tool parameters:

| Concept | Format | Postgres type | Example |
|---|---|---|---|
| Calendar date | `YYYY-MM-DD` (ISO 8601 date) | `date` | `2026-09-05` |
| Clock time | `HH:mm`, 24-hour, campus-local (single time zone — no offset needed) | `time` | `15:00` |
| A deadline that can cross midnight and needs unambiguous ordering | full ISO 8601 timestamp | `timestamptz` | `2026-09-12T23:59:00+05:30` |

`assignments.deadline` is the **only** field that uses the full timestamp — every other
date/time field in the schema is a plain `date` or `time` pair, because schedules, bookings,
and events are always same-day, campus-local, and never need to be compared across days at
sub-day precision.

Seed script (`backend/src/db/seed.ts`) reads the five files in `data/`, transforms the
embedded `bookings`/`registrations` arrays into rows in the two join tables, and upserts on
`id` — safe to re-run without duplicating rows.

---

## Target directory layout

```
backend/
└─ src/
   ├─ index.ts                     express app: mounts routes, CORS, JSON body parsing, error middleware
   ├─ db/
   │  ├─ client.ts                 supabase client (service role — backend only, never bundled to frontend)
   │  ├─ schema.sql                table definitions + FKs for the 7 tables (see Data model)
   │  └─ seed.ts                   loads data/*.json into Supabase, upserts on id (see seed script note)
   ├─ services/                    the ONLY layer that talks to Supabase — see architecture rule
   │  ├─ scheduleService.ts
   │  ├─ roomService.ts            + findAvailable(), book(), cancelBooking() — conflict check lives here
   │  ├─ eventService.ts           + register(), cancelRegistration() — capacity check lives here
   │  ├─ announcementService.ts
   │  └─ assignmentService.ts
   ├─ routes/                      thin Express controllers over services/ — no business logic here
   │  ├─ schedules.ts
   │  ├─ rooms.ts
   │  ├─ events.ts
   │  ├─ announcements.ts
   │  ├─ assignments.ts
   │  └─ agent.ts                  POST /api/agent/chat
   └─ agent/
      ├─ tools.ts                  9 tool schemas + handlers, call services/* — never Supabase directly
      ├─ systemPrompt.ts           identity + the 4 behavior rules (see below) + injected current date/time
      ├─ llmClient.ts              Google GenAI SDK wrapper (@google/genai), swappable — see AGENTS.md
      └─ runAgent.ts               the tool-use loop: prompt → Gemini → tool call → tools.ts → Gemini → reply

frontend/
└─ src/
   ├─ App.tsx                      router/shell, mounts Dashboard + ChatPanel, owns the TanStack QueryClient
   ├─ pages/
   │  └─ Dashboard.tsx             lays out the five CRUD sections
   ├─ components/
   │  ├─ ScheduleSection.tsx
   │  ├─ RoomSection.tsx           + book/cancel UI
   │  ├─ EventSection.tsx          + register/cancel UI
   │  ├─ AnnouncementSection.tsx
   │  ├─ AssignmentSection.tsx
   │  └─ ChatPanel.tsx             message list + input, calls /api/agent/chat, invalidates queries on `mutated`
   └─ lib/
      └─ api.ts                   typed fetch wrapper — the ONLY thing components use to hit the backend
```

---

## REST API surface

Standard CRUD on all five systems, plus the two systems with extra actions (rooms, events).
All routes are thin — they validate the request shape and call straight into `services/*.ts`;
business logic (conflict checks, capacity checks) lives in the service, not here.

| System | Endpoints |
|---|---|
| Schedules | `GET/POST /api/schedules`, `PUT/DELETE /api/schedules/:id` |
| Rooms | `GET/POST /api/rooms`, `PUT/DELETE /api/rooms/:id`, `POST /api/rooms/:id/book`, `POST /api/bookings/:id/cancel` |
| Events | `GET/POST /api/events`, `PUT/DELETE /api/events/:id`, `POST /api/events/:id/register`, `POST /api/events/:id/registrations/:regId/cancel` |
| Announcements | `GET/POST /api/announcements`, `PUT/DELETE /api/announcements/:id` |
| Assignments | `GET/POST /api/assignments`, `PUT/DELETE /api/assignments/:id` |
| Agent | `POST /api/agent/chat` — request `{ message: string, history?: ChatTurn[] }`, response `{ reply: string, mutated: string[] }`. `mutated` names the resource types (`"rooms"`, `"bookings"`, `"events"`, …) any tool call actually wrote in this turn — see [Request lifecycle](#request-lifecycle--a-full-trace) step 9 for how the frontend uses it. |

---

## Agent tool contract

Scope is deliberately **read + the actions the brief actually names** — not full CRUD. The
dashboard already owns full add/edit/delete (Part 1's 20+20 marks); giving the agent the same
surface multiplies untested edge cases (auth, destructive actions) for marks the rubric
doesn't allocate there. If time remains after everything else: `create_announcement` is the
cheapest addition.

Parameter names match the Postgres column names 1:1 (see [Data model](#data-model) and
[Time & date conventions](#time--date-conventions-applies-to-bookings-schedules-events)) —
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
   `POST /api/agent/chat`.
2. **`routes/agent.ts`** hands it to **`agent/runAgent.ts`**. Before the first Gemini call,
   `runAgent.ts` reads the server clock and injects the current campus-local date into the
   system prompt as a literal line — e.g. `Current date: 2026-09-04 (Thursday)` — via
   `systemPrompt.ts`. This is what lets Gemini resolve "tomorrow" into an absolute date
   server-side; it is never left for the model to guess, and it never drifts from the client's
   clock, because the client's clock is never consulted.
3. `runAgent.ts` calls Gemini via **`agent/llmClient.ts`** with that system prompt + the 9 tool
   declarations. Gemini resolves "tomorrow" → `2026-09-05` and "3 to 5 PM" → `15:00`/`17:00`,
   and — forbidden by rule 1 from answering from memory — calls
   `find_available_rooms(date: "2026-09-05", start_time: "15:00", end_time: "17:00")`.
4. **`agent/tools.ts`**'s handler calls `roomService.findAvailable()` — the exact same
   function `routes/rooms.ts` would call if the dashboard's "available now" filter used it.
5. `roomService.findAvailable()` queries Supabase directly (it's inside the service layer),
   checking room 302 against the `bookings` table for overlap in that window.
6. Result flows back to Gemini. Room 302 is free → Gemini calls
   `book_room(room_id: "302", date: "2026-09-05", start_time: "15:00", end_time: "17:00",
   booked_by, purpose)`.
7. `roomService.book()` re-checks the overlap (never trust the earlier read as still valid —
   time has passed) and, if still clear, inserts the `bookings` row.
8. Response flows back through `runAgent.ts` → `routes/agent.ts` → `ChatPanel.tsx` as
   `{ reply: "Booked Room 302 for you, 3–5 PM tomorrow.", mutated: ["rooms"] }` — `mutated`
   names which resource types the tool calls in this turn actually wrote.
9. **Freshness on the dashboard side:** `ChatPanel.tsx` sees `mutated: ["rooms"]` and calls
   `queryClient.invalidateQueries({ queryKey: ["rooms"] })` (TanStack Query) — the same cache
   key `RoomSection.tsx` reads from. No manual reload, no polling: the next render pulls the
   fresh row straight from the invalidated query, which refetches from the same
   `GET /api/rooms` → `roomService` path the dashboard always uses.
10. **Freshness check, the actual point of the exercise:** if a judge now opens the dashboard's
    `RoomSection.tsx`, the same `roomService.book()` write is what they'd see — because it's
    the same table, written by the same service function the route handler would have called,
    and the query cache pointing at it was just invalidated. There is no second copy of the
    data, no cache lag, nothing to go stale.

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
| 0 — Setup | Supabase project, `.env` filled, Vite + Express scaffolds, `schema.sql` applied | **Not started** |
| 1 — Data layer | `db/schema.sql`, `db/seed.ts` runs clean, `services/*.ts` for all 5 systems | Not started |
| 2 — REST API | `routes/*.ts`, thin controllers, full CRUD on all 5 | Not started |
| 3 — Dashboard UI | 5 sections, table + add/edit dialog + delete confirm, wired to `lib/api.ts` | Not started |
| 4 — Agent backend | `agent/tools.ts`, `systemPrompt.ts`, `runAgent.ts`, `POST /api/agent/chat` | Not started |
| 5 — Chat UI | `ChatPanel.tsx` | Not started |
| 6 — Test against the brief | Every query in `sample_queries/sample_queries.md` + shadow-path cases | Not started |
| 7 — README + polish | Fill required README sections, tidy empty/loading/error states | Not started |

Full time-boxed minute budget per phase is in [`PLAN.md`](./PLAN.md#build-order-time-boxed-against-the-830-pm-deadline).

---

## Environment variables

A single `.env` at the **repo root** (see [`.env.example`](./.env.example), also at the
root) — not `backend/.env`. The backend process loads it from there:

| Var | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Backend-only Supabase service-role key — never ship to the frontend bundle or client-side code |
| `GEMINI_API_KEY` | yes | Google AI Studio key, used by `agent/llmClient.ts` (Google GenAI SDK) |
| `PORT` | yes | Express listen port |

Never commit `.env` or real keys — `.env.example` is the template and should only ever
contain placeholders.

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

- **LLM provider — resolved 2026-09-04:** Gemini via the Google GenAI SDK. See the
  [Stack](#stack) section's decision note. If you're an agent and encounter a doc that still
  says otherwise, treat this file as the source of truth and fix the stale doc.
- **Realtime scope — resolved by PLAN.md:** "no manual refresh" is read literally as
  same-client state update from the mutation response (TanStack Query cache invalidation keyed
  off the agent response's `mutated` field — see [Request lifecycle](#request-lifecycle--a-full-trace)
  step 9), not multi-tab broadcast. Supabase Realtime subscriptions are explicitly out of scope
  unless everything else lands early.
- **Agent CRUD scope — resolved by PLAN.md:** agent gets read + book/cancel/register/cancel,
  not full add/edit/delete. Don't widen this without checking the rubric first — it adds edge
  cases without adding marks.
- **Time is the actual constraint**, not any technical unknown — the whole stack is
  intentionally boring and well-trodden. If cutting scope, cut bonus items (deploy, Phase 5b
  multi-tab realtime) before cutting Phase 1–6.

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
| Backend | Express + TypeScript | One process, one port. |
| Frontend | React (Vite) + TypeScript + Tailwind + shadcn/ui | shadcn buys accessible, polished dialogs/tables/forms without hand-rolled CSS. |
| Database | Supabase (Postgres) | Accessed **only** from the Express backend via the service-role key. Frontend never talks to Supabase directly. |
| LLM | **Google Gemini** (`gemini-2.5-flash` or `gemini-2.5-pro`), native function calling via `tools`/`functionDeclarations` | Isolated behind `agent/llmClient.ts` so swapping providers later is a ~15-line change, not a rewrite. |

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
                     ┌─────────────────────┐
   React Dashboard ──┤                     │
   (CRUD UI)          │   Express API       │
                     │   routes/*.ts        │
                     │        │             │
                     │        ▼             │
                     │   services/*.ts  ◄───┼── agent/tools.ts
                     │   (single source      │   (Gemini tool calls
                     │    of truth)          │    route through here)
                     │        │             │
                     └────────┼─────────────┘
                              ▼
                        Supabase (Postgres)
```

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
tables.

```
schedules                    rooms                         events
├─ id (PK)                   ├─ id (PK)                    ├─ id (PK)
├─ course                    ├─ room_number                ├─ name
├─ title                     ├─ type                       ├─ description
├─ day                       ├─ capacity                   ├─ date / end_date
├─ start_time / end_time     ├─ equipment[]                ├─ start_time / end_time
├─ room                      ├─ floor                      ├─ venue
├─ instructor                └─ status                     ├─ organizer
└─ section                        │                        ├─ capacity
                                  │ 1                        ├─ registered (computed, not stored)
                                  │                          └─ status
                                  ▼ *                              │
                            bookings                               │ 1
                            ├─ id (PK)                              │
                            ├─ room_id (FK → rooms.id)              ▼ *
                            ├─ booked_by                      event_registrations
                            ├─ date                           ├─ id (PK)
                            ├─ start_time / end_time          ├─ event_id (FK → events.id)
                            └─ purpose                        ├─ student_id
                                                               └─ name

announcements                assignments
├─ id (PK)                   ├─ id (PK)
├─ title                     ├─ course / course_title
├─ body                      ├─ title / description
├─ date                      ├─ assigned_date / deadline
├─ priority                  ├─ submission_platform
├─ posted_by                 ├─ status
└─ expires                   └─ marks
```

**Two fields deliberately become computed, not stored:**
- `events.registered` — a `COUNT(*)` over `event_registrations` where `event_id` matches, not
  a field the app has to remember to increment/decrement. A stored count can drift; a computed
  one can't.
- Room booking conflicts — checked at write time in `roomService.book()` via
  `start_time < existing.end_time AND end_time > existing.start_time` over the `bookings` FK
  relation, not by scanning a JSON array.

Seed script (`backend/src/db/seed.ts`) reads the five files in `data/`, transforms the
embedded `bookings`/`registrations` arrays into rows in the two join tables, and upserts on
`id` — safe to re-run without duplicating rows.

---

## Target directory layout

```
backend/src/
  index.ts                 express app, mounts routes, CORS, JSON body parsing, error middleware
  db/
    client.ts               supabase client (service role — backend only, never bundled to frontend)
    schema.sql               table definitions + FKs for the 7 tables above
    seed.ts                   loads data/*.json into Supabase (see seed script note above)
  services/                 the ONLY layer that talks to Supabase — see architecture rule
    scheduleService.ts
    roomService.ts           + findAvailable(), book(), cancelBooking() — conflict check lives here
    eventService.ts          + register(), cancelRegistration() — capacity check lives here
    announcementService.ts
    assignmentService.ts
  routes/                   thin controllers over services/ — no business logic here
    schedules.ts rooms.ts events.ts announcements.ts assignments.ts
    agent.ts                 POST /api/agent/chat
  agent/
    tools.ts                 9 tool schemas + handlers, call services/* — never Supabase directly
    systemPrompt.ts           identity + the 4 behavior rules (see below)
    llmClient.ts               Gemini wrapper (@google/generative-ai), swappable
    runAgent.ts                 the tool-use loop
frontend/src/
  App.tsx
  pages/
    Dashboard.tsx
  components/
    ScheduleSection.tsx RoomSection.tsx (+ book/cancel UI) EventSection.tsx (+ register/cancel UI)
    AnnouncementSection.tsx AssignmentSection.tsx
    ChatPanel.tsx             message list + input, calls /api/agent/chat
  lib/
    api.ts                   typed fetch wrapper — the ONLY thing components use to hit the backend
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
| Agent | `POST /api/agent/chat` |

---

## Agent tool contract

Scope is deliberately **read + the actions the brief actually names** — not full CRUD. The
dashboard already owns full add/edit/delete (Part 1's 20+20 marks); giving the agent the same
surface multiplies untested edge cases (auth, destructive actions) for marks the rubric
doesn't allocate there. If time remains after everything else: `create_announcement` is the
cheapest addition.

| Tool | Parameters | Calls into |
|---|---|---|
| `get_schedule` | `course?`, `day?` | `scheduleService` |
| `get_assignments` | `course?`, `status?` | `assignmentService` |
| `get_events` | `date?`, `status?` | `eventService` |
| `get_announcements` | `priority?` | `announcementService` |
| `find_available_rooms` | `date`, `start`, `end`, `min_capacity?`, `equipment?` | `roomService.findAvailable()` |
| `book_room` | `room_id`, `date`, `start`, `end`, `booked_by`, `purpose` | `roomService.book()` |
| `cancel_booking` | `booking_id` | `roomService.cancelBooking()` |
| `register_for_event` | `event_id`, `student_id`, `name` | `eventService.register()` |
| `cancel_registration` | `event_id`, `student_id` | `eventService.cancelRegistration()` |

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

1. **`ChatPanel.tsx`** posts the message to `POST /api/agent/chat`.
2. **`routes/agent.ts`** hands it to **`agent/runAgent.ts`**, which calls Gemini via
   **`agent/llmClient.ts`** with the system prompt + the 9 tool declarations.
3. Gemini decides it needs room availability first — the system prompt (rule 1) forbids
   answering from memory — and calls `find_available_rooms(date, start, end)`.
4. **`agent/tools.ts`**'s handler calls `roomService.findAvailable()` — the exact same
   function `routes/rooms.ts` would call if the dashboard's "available now" filter used it.
5. `roomService.findAvailable()` queries Supabase directly (it's inside the service layer),
   checking room 302 against the `bookings` table for overlap in that window.
6. Result flows back to Gemini. Room 302 is free → Gemini calls `book_room(room_id, date,
   start, end, booked_by, purpose)`.
7. `roomService.book()` re-checks the overlap (never trust the earlier read as still valid —
   time has passed) and, if still clear, inserts the `bookings` row.
8. Response flows back through `runAgent.ts` → `routes/agent.ts` → `ChatPanel.tsx`: *"Booked
   Room 302 for you, 3–5 PM tomorrow."*
9. **Freshness check, the actual point of the exercise:** if a judge now opens the dashboard's
   `RoomSection.tsx`, the same `roomService.book()` write is what they'd see — because it's
   the same table, written by the same service function the route handler would have called.
   There is no cache, no second copy, nothing to go stale.

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

Backend `.env` (see [`.env.example`](./.env.example)):

| Var | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Backend-only key — never ship to the frontend bundle or client-side code |
| `GEMINI_API_KEY` | yes | Google AI Studio key, used by `agent/llmClient.ts` |
| `PORT` | yes | Express listen port |

Never commit `.env` or real keys — `.env.example` is the template and should only ever
contain placeholders.

---

## Shadow-path coverage (what "handling it well" means in practice)

Per system, applied where it matters most — booking:

- **Nil input** — `book_room` called without `date`/`start`/`end` → validation error the
  agent surfaces as a clarifying question, never a 500.
- **Empty result** — `find_available_rooms` finds nothing → agent says so plainly, offers to
  relax a constraint, doesn't hallucinate a room.
- **Conflict** — `book_room` on an already-booked window → service layer detects the overlap
  and returns a conflict; agent relays it, doesn't silently double-book.
- **Unauthorized** — cancel/register on a record not tied to the requester's stated identity
  → refuse with a stated reason.

---

## Open decisions / risks

- **LLM provider — resolved 2026-09-04:** Gemini. See the [Stack](#stack) section's decision
  note. If you're an agent and encounter a doc that still says otherwise, treat this file as
  the source of truth and fix the stale doc.
- **Realtime scope — resolved by PLAN.md:** "no manual refresh" is read literally as
  same-client state update from the mutation response, not multi-tab broadcast. Supabase
  Realtime subscriptions are explicitly out of scope unless everything else lands early.
- **Agent CRUD scope — resolved by PLAN.md:** agent gets read + book/cancel/register/cancel,
  not full add/edit/delete. Don't widen this without checking the rubric first — it adds edge
  cases without adding marks.
- **Time is the actual constraint**, not any technical unknown — the whole stack is
  intentionally boring and well-trodden. If cutting scope, cut bonus items (deploy, Phase 5b
  multi-tab realtime) before cutting Phase 1–6.

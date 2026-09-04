# CampusOS — Implementation Plan

Deadline: **8:30 PM, 4 September** (today). Plan is time-boxed to that.

> **2026-09-04 update:** the layout below (`backend/`+`frontend/`, Tailwind/shadcn,
> `lib/api.ts`) was the original plan. What actually got scaffolded is an npm-workspaces
> monorepo — `client/` + `server/` + `shared/`, hand-rolled CSS, Axios + Zustand — built with
> generic auth/user boilerplate that predates this domain. The team decided to keep that
> scaffold rather than restart in `backend/`/`frontend/`. **`ARCHITECTURE.md` is the current
> source of truth** for directory layout, stack, and file paths — see its
> [Target directory layout](./ARCHITECTURE.md#target-directory-layout) and
> [Open decisions](./ARCHITECTURE.md#open-decisions--risks) sections. Everything below this
> point (file structure, exact paths, `db/seed.ts` location, etc.) still holds *conceptually*
> — same 7 tables, same services, same agent tools, same phases — but read path names as
> `server/src/...` / `client/src/...`, not `backend/src/...` / `frontend/src/...`.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Express + TypeScript, in `server/` | You already had this in mind. One process, one port, trivial to `npm run dev` and document. |
| Frontend | React (Vite) + TypeScript, in `client/` — hand-rolled CSS, not Tailwind/shadcn (see update note above) | Original rationale (below) still applies to the *effect* — polished, accessible components without much extra time — just via the components already scaffolded (`client/src/components/common/`, `.../layout/`) instead of shadcn. |
| Database | Supabase (Postgres) | Your call, and a good one — real persistent backend, judges don't need to install/run a DB themselves (just need env vars), free tier is instant. Accessed **only** from the Express backend via the service-role key. The frontend never talks to Supabase directly. |
| LLM | **Google Gemini** (`gemini-2.5-flash` or `gemini-2.5-pro`), native function calling via `tools`/`functionDeclarations` | Your call. Gemini's function calling is mature and fast, `gemini-2.5-flash` keeps chat latency low for a live demo. The system prompt still carries the explicit rules for *ask when unclear, refuse when it shouldn't act* (10 of the 40 agent marks) — that behavior isn't provider-specific, it's prompt + tool design. The LLM call is isolated behind one module (`agent/llmClient.ts`) — swapping providers later is a ~15-line change, not a rewrite. |

## Non-negotiable architecture rule

**The agent and the REST API call the same service layer.** Not two copies of "how to read a room," not the agent hitting Supabase directly while routes go through a different path. One `services/*.ts` per system, used by both `routes/*.ts` (dashboard CRUD) and `agent/tools.ts` (agent actions). This is what makes "the agent always reads live data" true by construction instead of something you have to remember to keep in sync — and it directly satisfies the 10 marks for "always using the latest data."

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

## Data model

Mirrors `schema/schema.md`, normalized (not JSONB blobs) so booking-conflict and capacity queries are cheap SQL, not app-level array scanning:

- `schedules` — as-is from schema
- `rooms` — as-is, minus embedded `bookings`
- `bookings` — `id, room_id (FK), booked_by, date, start_time, end_time, purpose` — separate table so "is this room free at this time" is a `WHERE` clause, not a JSON filter
- `events` — as-is, minus embedded `registrations`; `registered` becomes a computed count, not a stored field that can drift
- `event_registrations` — `id, event_id (FK), student_id, name`
- `announcements` — as-is
- `assignments` — as-is

Seed script (`db/seed.ts`) reads the five JSON files in `data/`, transforms `bookings`/`registrations` arrays into rows in the two join tables, and upserts on `id` — safe to re-run.

## File structure

See `ARCHITECTURE.md`'s [Target directory layout](./ARCHITECTURE.md#target-directory-layout)
for the authoritative, up-to-date version (it also marks what already exists from the auth
scaffold vs. what's new). Same shape, real paths:

```
server/
  src/
    app.ts                    # express app, mounts routes — already exists
    db/schema.sql              # table definitions + FKs — already exists, done
    db/seed.ts                  # loads data/*.json into Supabase — not yet written
    services/
      scheduleService.ts
      roomService.ts           # includes findAvailable(), book(), cancelBooking()
      eventService.ts          # includes register(), cancelRegistration()
      announcementService.ts
      assignmentService.ts
    controllers/                # parse req, call service, format response — new layer
      schedule.controller.ts room.controller.ts event.controller.ts
      announcement.controller.ts assignment.controller.ts agent.controller.ts
    routes/v1/
      schedule.routes.ts room.routes.ts event.routes.ts
      announcement.routes.ts assignment.routes.ts
      agent.routes.ts          # POST /api/v1/agent/chat
    agent/
      tools.ts                 # tool schemas + handlers, call services/*
      systemPrompt.ts
      llmClient.ts              # Google GenAI SDK (@google/genai) wrapper, swappable
      runAgent.ts                # tool-use loop
client/
  src/
    App.tsx                    # already exists
    features/campus/
      ScheduleSection.tsx RoomSection.tsx EventSection.tsx
      AnnouncementSection.tsx AssignmentSection.tsx
      ChatPanel.tsx
    services/campusService.ts   # typed API functions, via existing services/api.ts (Axios)
    store/campusStore.ts        # Zustand — sections read from here; ChatPanel refetches into it
```

## Agent tools (scope: read + the actions the brief actually names)

Read tools: `get_schedule`, `get_assignments`, `get_events`, `get_announcements`.
Action tools: `find_available_rooms(date, start_time, end_time, min_capacity?, equipment?)`, `book_room(room_id, date, start_time, end_time, booked_by, purpose)`, `cancel_booking(booking_id, booked_by)`, `register_for_event(event_id, student_id, name)`, `cancel_registration(event_id, student_id)`. Param names match the Postgres columns 1:1 — see `ARCHITECTURE.md`'s [Agent tool contract](./ARCHITECTURE.md#agent-tool-contract).

Deliberately **not** exposing full add/edit/delete of core records (schedule/room/event/announcement/assignment) to the agent — the brief's own agent examples are all read + book/register, and the dashboard already owns full CRUD (Part 1's 20+20 marks). Keeping agent scope tight means fewer untested edge cases in the time available. If time remains after everything else, `create_announcement` is the cheapest add.

System prompt rules (these map straight to the 4 agent sub-scores):
1. Never answer from memory — always call a read tool first for anything data-shaped.
2. If a request is missing a required parameter (time, room, size) — **ask**, don't guess or pick a default. ("Just book me any room tomorrow afternoon" → ask which time and how many people.)
3. If a request has no matching tool, or targets something the requester has no standing to change (e.g. cancelling a booking that isn't theirs, no `booked_by`/identity match) — **refuse**, state why, don't attempt a workaround.
4. Before a destructive/irreversible action (cancel, delete), restate what will happen and proceed only on a clear instruction — the sample queries are direct commands ("Book Room 7A02...") so don't over-confirm the happy path, just the ambiguous/destructive ones.

## Realtime requirement ("no manual refresh")

Read literally: within *this* client, after any add/edit/delete/book/register, the UI must reflect it immediately with no reload. That's solved by updating local state from the mutation's response (or refetching that section) — no websockets/polling needed for the rubric as written. Supabase Realtime subscriptions would additionally sync across *multiple open tabs/clients live*, which is not asked for — worth 20-30 min only if everything else is done early.

## Build order (time-boxed against the 8:30 PM deadline)

| Phase | Time | Output |
|---|---|---|
| 0. Setup | 15 min | **Done, differently than planned** — `client`/`server`/`shared` workspace scaffold + `schema.sql` applied landed via a teammate's push; see `ARCHITECTURE.md`'s Open decisions |
| 1. Data layer | 45 min | `server/src/db/seed.ts`, `services/*.ts` for all 5 systems incl. `findAvailable`/`book`/`register` |
| 2. REST API | 30 min | `routes/v1/*.ts` + `*.controller.ts` — GET/POST/PUT/DELETE for all 5, thin controllers over services |
| 3. Dashboard UI | 75 min | 5 sections in `client/src/features/campus/`, table + add/edit dialog + delete confirm per section, wired to `campusService.ts`, `campusStore.ts` (Zustand) update on every mutation |
| 4. Agent backend | 60 min | `server/src/agent/tools.ts`, `systemPrompt.ts`, `runAgent.ts` tool-use loop, `POST /api/v1/agent/chat` |
| 5. Chat UI | 25 min | `ChatPanel.tsx` — message list + input, calls `/api/v1/agent/chat` |
| 6. Test against the brief | 30 min | Walk every query in `sample_queries/sample_queries.md` verbatim, plus: double-booking conflict, vague booking request, cancel-someone-else's-booking (refusal), edit via dashboard → immediately ask agent (freshness check) |
| 7. README + polish | 20 min | Fill in the required README sections (below), tidy empty/loading/error states |
| Buffer | ~20-25 min | Slippage absorber — cut Phase 5b (multi-tab realtime) or bonus deploy first if short |

Total: ~4h40m, matches the time remaining right now (3:43 PM → 8:30 PM).

## Explicit shadow-path coverage (per system, applied where it matters most: booking)

- **nil input** — `book_room` called without `date`/`start`/`end` → tool handler returns a validation error the agent surfaces as a clarifying question, never a 500.
- **empty result** — `find_available_rooms` finds nothing matching → agent says so plainly, offers to relax a constraint (different time/smaller room), doesn't hallucinate a room.
- **conflict / upstream state** — `book_room` where the room is already booked in that window → service layer checks overlap (`start_time < existing.end_time AND end_time > existing.start_time`) and returns a conflict; agent relays it, doesn't silently double-book.
- **unauthorized** — cancel/register actions targeting a record not tied to the requester's stated identity → refuse with a stated reason.

## README requirements (checklist, per SUBMISSION.md)

- [ ] One-paragraph overview
- [ ] Tech stack (Express/TS, React/Vite/TS, Supabase, Gemini)
- [ ] Exact setup commands (`npm install` at the repo root installs all workspaces, `npm run dev` runs `server`+`client` concurrently)
- [ ] Every `.env` key explained (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `PORT`), no real keys committed
- [ ] Example questions to ask the agent

## Bonus (only if Phase 0-7 lands with time to spare)

- Deploy: frontend → Vercel, backend → Render/Railway (both free tier, both take env vars). Supabase is already hosted, so no persistence problem on redeploy.
- Code cleanliness: consistent naming, no dead code, one lint pass.

## What's needed from you right now, in parallel with me scaffolding

1. A Supabase project → `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
2. A `GEMINI_API_KEY` (from Google AI Studio) — same architecture if you'd rather switch again later.

## Risks

- **Time is the actual constraint**, not any technical unknown here — every piece of this stack is boring and well-trodden on purpose. Cut bonus items first, never Phase 1-6.
- Supabase/LLM key setup is the one step I can't do for you — give me those the moment you have them and I start Phase 1 immediately.

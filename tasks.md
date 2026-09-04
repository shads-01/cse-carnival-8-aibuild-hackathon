# CampusOS — Task Split (Arko / Shads / Hrittika)

Deadline: **8:30 PM, 4 September 2026**. Full architecture and rationale: [`PLAN.md`](./PLAN.md).

> When you finish a checklist item below, check it **and** strike it through: `- [x] ~~item~~`.

Goal: all three of you work **in parallel with zero blocking dependencies**. Agree the
contract once, then each own a track nobody else touches until the final integration step.

```
        SHARED CONTRACT (15 min, all 3 together)
   DB schema · REST endpoint shapes · agent tool signatures
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ARKO            SHADS            HRITTIKA
   Backend/Data     Dashboard UI     AI Agent
   (services +      (React CRUD      (tool-use loop
    REST API)         UI)             + chat UI)
        │               │               │
        └───────── INTEGRATE (last ~30 min) ──────────┘
```

Shads and Hrittika build against mocked responses matching the contract until Arko's real
API/services are up — then it's a swap, not a rewrite.

---

## Shared contract (do together first, ~15 min)

- [x] ~~Confirm DB schema (7 tables): `schedules`, `rooms`, `bookings`, `events`,
      `event_registrations`, `announcements`, `assignments` — see `schema/schema.md`~~
- [x] ~~Confirm REST endpoint list + request/response JSON shape per system
      (e.g. `GET/POST/PUT/DELETE /api/v1/rooms`, `POST /api/v1/rooms/:id/book`,
      `POST /api/v1/events/:id/register`)~~
- [x] ~~Confirm agent tool contract: `get_schedule`, `get_assignments`, `get_events`,
      `get_announcements`, `find_available_rooms`, `book_room`, `cancel_booking`,
      `register_for_event`, `cancel_registration`~~
- [x] ~~One person creates the Supabase project, shares `SUPABASE_URL` +
      `SUPABASE_SERVICE_ROLE_KEY` with the other two (never commit real keys)~~
- [x] ~~Commit a filled-out `.env.example` reflecting the final key names, including
      `GEMINI_API_KEY`~~

---

## Arko — Backend & Data Layer

Owns: Supabase schema, seed script, `services/*.ts`, REST API.

- [x] ~~`db/schema.sql` — create the 7 tables + foreign keys in Supabase~~
- [x] ~~`db/seed.ts` — load `data/*.json` into Supabase, transforming embedded
      `bookings`/`registrations` arrays into the join tables; safe to re-run (upsert on `id`)~~
- [x] ~~`services/scheduleService.ts`~~
- [x] ~~`services/roomService.ts` (+ `findAvailable`, `book`, `cancelBooking`)~~
- [x] ~~`services/eventService.ts` (+ `register`, `cancelRegistration`)~~
- [x] ~~`services/announcementService.ts`~~
- [x] ~~`services/assignmentService.ts`~~
- [x] ~~`routes/schedules.ts`, `rooms.ts`, `events.ts`, `announcements.ts`,
      `assignments.ts` — thin controllers over services, full CRUD on all 5~~
- [x] ~~Booking overlap check + event capacity check live in the service layer, not the
      route handlers — that's what the agent tools call into too~~
- [x] ~~Express app scaffold: `index.ts`, CORS, JSON body parsing, error middleware~~
- [x] ~~Manual test every endpoint (curl/Postman/automated test suite) against seeded data before calling it done~~

## Shads — Dashboard Frontend

Owns: the React CRUD UI for all 5 systems. Build against mocked JSON matching the
contract — you don't need Arko's server running to start.

- [ ] Vite + React + TypeScript + Tailwind + shadcn/ui scaffold
- [ ] `lib/api.ts` — typed fetch wrapper matching the agreed API contract
- [ ] `ScheduleSection.tsx`
- [ ] `RoomSection.tsx` (+ book/cancel UI)
- [ ] `EventSection.tsx` (+ register/cancel UI)
- [ ] `AnnouncementSection.tsx`
- [ ] `AssignmentSection.tsx`
- [ ] Each section: table view + add/edit dialog + delete confirm
- [ ] Every mutation updates local state immediately from the response — no manual
      refresh required, per the brief
- [ ] Loading / empty / error states for every section
- [ ] Swap mocked data for real `fetch` calls once Arko's routes are live — the one
      integration point with Arko's track

## Hrittika — AI Agent

Owns: tool calling, LLM integration, chat UI. LLM provider: **Google Gemini**
(function calling via `tools`/`functionDeclarations`). Build tool handlers against the
agreed service signatures, stubbing the data calls until Arko's services are live.

- [ ] `agent/systemPrompt.ts` — identity + 4 behavior rules: always read via a tool
      (never answer from memory), ask when a request is missing a required parameter,
      refuse when unauthorized or when no tool matches, confirm before a
      destructive/irreversible action
- [ ] `agent/llmClient.ts` — Gemini wrapper (`@google/generative-ai`), kept swappable
- [ ] `agent/runAgent.ts` — the tool-use loop
- [ ] `agent/tools.ts` — the 9 tool schemas + handlers
- [ ] `routes/agent.ts` — `POST /api/agent/chat`
- [ ] `ChatPanel.tsx` — message list + input, calls `/api/agent/chat`
- [ ] Wire tool handlers to Arko's real services once live — the one integration point
      with Arko's track
- [ ] Test every query in `sample_queries/sample_queries.md`, plus the shadow-path cases:
      nil input, empty result, booking conflict, unauthorized action

---

## Integration (all 3, last ~30 min)

- [ ] Shads' dashboard and Hrittika's chat panel both point at Arko's real API (swap out
      any mocks)
- [ ] Full walkthrough together: edit a record via the dashboard → immediately ask the
      agent about it → confirm the answer reflects the edit (the single most graded
      behavior in the whole brief)
- [ ] `README.md` — overview paragraph, tech stack, exact setup commands, every `.env`
      key explained, example questions to ask the agent
- [ ] Final pass against the `SUBMISSION.md` checklist before submitting

## Verification (per person, before integration)

- **Arko** — curl every endpoint against seeded data.
- **Shads** — exercise every CRUD action in the UI against mocked data.
- **Hrittika** — run every `sample_queries.md` query against stubbed tool responses.

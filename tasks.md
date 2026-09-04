# CampusOS — Task Split (Arko / Shads / Hrittika) — v4

Deadline: **8:30 PM, 4 September 2026**. Full architecture and rationale: [`PLAN.md`](./PLAN.md).

> **v4 changes (repo-aligned):** monorepo is `client/` + `server/` + `shared/` (npm workspaces);
> styling = vanilla CSS Ocean Glass tokens (not Tailwind/shadcn); auth = Supabase Auth
> (with custom JWT fallback); routes = `/admin/*` + `/app/*` (18 pages total);
> Shads owns all UI including chat; approval flow for room bookings; notifications system.
> When you finish a checklist item below, check it **and** strike it through: `- [x] ~~item~~`.

Goal: all three of you work **in parallel with zero blocking dependencies**. Agree the
contract once, then each own a track nobody else touches until the final integration step.

```
        SHARED CONTRACT (15 min, all 3 together)
   DB schema · REST endpoint shapes · agent tool signatures
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ARKO             SHADS            HRITTIKA
   Backend/Data      All UI           AI Agent
   (services +       (18 pages,       (tool-use loop,
    REST API +        chat UI,         system prompt,
    auth setup)       design system)   LLM client)
        │               │               │
        └───────── INTEGRATE (last ~30 min) ──────────┘
```

Shads and Hrittika build against mocked responses matching the contract until Arko's real
API/services are up — then it's a swap, not a rewrite.

---

## Pre-flight fixes (blocking — do BEFORE parallel work)

- [ ] **`.env.example`** — resolve merge conflict markers into one merged file: `PORT=5000`,
      `NODE_ENV`, `CLIENT_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
      `SUPABASE_ANON_KEY`, `GEMINI_API_KEYS`, `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`,
      `VITE_SUPABASE_ANON_KEY` — **Arko owns this**
- [ ] **Supabase Auth** — enable email OTP, Google OAuth, password reset in Supabase console — **Arko**
- [x] ~~**`studentId`** — add `studentId?: string` to `User` + `RegisterPayload` in
      `shared/src/types/user.types.ts` — **Shads**~~
- [ ] Confirm API route base = `/api/v1/*` for all endpoints — **All**

## Shared contract (do together first, ~15 min)

- [x] ~~Confirm DB schema (7 tables): `schedules`, `rooms`, `bookings`, `events`,
      `event_registrations`, `announcements`, `assignments` — see `schema/schema.md`~~ — drafted and applied
- [ ] Add `notifications` table to schema (`id, user_id, type, title, body, link, read, created_at`)
      and `status`/`requester_id` to `bookings`
- [x] ~~**Blocking — do this before writing real (non-mocked) service/UI/tool code:**
      add `Schedule`/`Room`/`Booking`/`Event`/`EventRegistration`/`Announcement`/`Assignment`
      types to `shared/src/types/` (new file, e.g. `campus.types.ts`, exported from
      `shared/src/types/index.ts`) matching the confirmed schema. `server/` and `client/`
      both import domain types from `@shared/types`.~~ — implemented by Arko
- [x] ~~Confirm REST endpoint list + request/response JSON shape per system under `/api/v1/*`~~ — implemented
- [x] ~~Confirm agent tool contract: `get_schedule`, `get_assignments`, `get_events`,
      `get_announcements`, `find_available_rooms`, `book_room`, `cancel_booking`,
      `register_for_event`, `cancel_registration`~~
- [x] ~~One person creates the Supabase project, shares `SUPABASE_URL` +
      `SUPABASE_SERVICE_ROLE_KEY`~~ — verified live
- [x] ~~Commit filled-out `.env.example` reflecting final key names including `GEMINI_API_KEYS`~~

---

## Arko — Backend & Data Layer

Owns: Supabase schema, seed script, `server/src/services/*.ts`, REST API, auth setup.

- [ ] **Supabase Auth setup** — enable email OTP, Google OAuth provider, password reset;
      wire `server/src/middlewares/auth.ts` to validate Supabase JWT sessions (keep custom JWT fallback)
- [ ] `.env.example` merge resolution (ensure all keys present, no conflict markers)
- [x] ~~`server/src/db/schema.sql` — 7 tables + foreign keys in Supabase~~ — done, applied, verified live
- [ ] `schema.sql` update — add `notifications` table + `bookings.status`/`requester_id`
- [x] ~~`server/src/db/seed.ts` — load `data/*.json` into Supabase, transforming embedded
      `bookings`/`registrations` arrays into the join tables; safe to re-run (upsert on `id`)~~
- [x] ~~`server/src/services/scheduleService.ts`~~ — full CRUD, filtering by course/day/room/instructor/section
- [x] ~~`server/src/services/roomService.ts` (+ `findAvailable`, `book`, `cancelBooking`)~~
- [x] ~~`server/src/services/eventService.ts` (+ `register`, `cancelRegistration`)~~
- [x] ~~`server/src/services/announcementService.ts`~~
- [x] ~~`server/src/services/assignmentService.ts`~~
- [ ] `server/src/services/requestService.ts` — **NEW**: get pending, approve (→ confirmed + notification),
      reject (→ rejected + notification), conflict re-check at approve time
- [ ] `server/src/services/notificationService.ts` — **NEW**: create, getByUser, markRead, markAllRead
- [x] ~~Express app scaffold: `app.ts`/`server.ts`, CORS, JSON body parsing, error middleware~~ — already exists from the workspace scaffold, reuse as-is
- [x] ~~`server/src/routes/v1/schedule.routes.ts`, `room.routes.ts`, `event.routes.ts`,
      `announcement.routes.ts`, `assignment.routes.ts` + matching `*.controller.ts` —
      thin routers + controllers over services, full CRUD on all 5, mounted under `/api/v1`~~
- [ ] `server/src/routes/v1/request.routes.ts` + `request.controller.ts` — `POST /api/v1/requests/:id/approve`, `POST /api/v1/requests/:id/reject`
- [ ] `server/src/routes/v1/notification.routes.ts` + `notification.controller.ts` — `GET /api/v1/notifications`, `PUT /api/v1/notifications/:id/read`
- [x] ~~Booking overlap check + event capacity check live in the service layer, not the
      controllers — that's what the agent tools call into too~~
- [x] ~~Manual test every endpoint (curl/Postman/automated test suite) against seeded data before calling it done~~ (35/35 passing)

## Shads — All Frontend UI

Owns: the React UI for all 18 pages, chat panel, design system, auth flows. Build against
mocked JSON matching the contract — you don't need Arko's server running to start.

- [x] ~~**Design system** — rewrite `client/src/index.css` with "Ocean Glass" tokens
      (Style 5 Ocean Depth palette + Style 3 Apple Liquid Glass treatment), dark + light mode~~
- [x] ~~Update common components (Button, Input, Card, Modal) to use new glass tokens~~
- [x] ~~**New common components**: DataTable, RecordDialog, ConfirmDialog, StatusBadge,
      StatCard, Skeleton, Toast, EmptyState, ThemeToggle, NotificationBell~~
- [x] ~~**Chat components**: ChatPanel, ChatBubble, QuickChips, TypingIndicator~~
- [x] ~~**Auth components**: OtpFlow (shared between signup + forgot)~~
- [x] ~~**Layout components**: AdminLayout (sidebar + Outlet), StudentLayout (navbar + tabs + Outlet),
      AuthLayout (centered card), AdminSidebar, StudentNavbar, StudentBottomTabs~~
- [x] ~~**8 client services** cloning the `userService.ts` pattern: schedules, rooms, events,
      announcements, assignments, requests, notifications, agent~~
- [x] ~~**Routing**: AppRoutes with nested layout routes, RoleGuard (auth + role), SmartRedirect~~
- [x] ~~**Auth pages**: LoginPage (role tabs + Google + demo-creds card), SignupPage
      (edu email → OTP → profile + studentId), ForgotPage (email → OTP → reset)~~
- [x] ~~**Admin pages (8)**: Overview, Schedules, Rooms, Events, Announcements, Assignments,
      Requests (approval queue), Chat~~
- [x] ~~**Student pages (7)**: Home (countdown + timeline + deadlines), Schedule (read-only grid),
      Events (one-tap register + capacity bars), Announcements (priority filter),
      Assignments (urgency badges), Activity (my requests + registrations), Chat (quick-prompt chips)~~
- [x] ~~NotificationBell dropdown with deep-links~~
- [x] ~~Toast system (success/error on every mutation)~~
- [x] ~~Dark/light theme toggle (persisted to localStorage)~~
- [x] ~~Mobile-first responsive: 360px verified first, then tablet, then desktop~~
- [x] ~~Every mutation updates local state immediately — no manual refresh~~
- [x] ~~Loading / empty / error states for every page~~

### Non-negotiable rule
Never call Supabase from the frontend for data operations. Everything goes through
`services/*.ts` → Arko's REST routes. Supabase client is used client-side ONLY for auth.

## Hrittika — AI Agent

Owns: tool calling, LLM integration (Google Gemini, native function calling), system prompt.
**Chat UI is now Shads' responsibility** — Hrittika provides the backend endpoint.

- [x] ~~`server/src/agent/systemPrompt.ts` — identity + 4 behavior rules: always read via a tool
      (never answer from memory), ask when a request is missing a required parameter,
      refuse when unauthorized or when no tool matches, confirm before a
      destructive/irreversible action~~
- [x] ~~`server/src/agent/llmClient.ts` — Google GenAI SDK (`@google/genai`) wrapper with multi-key rotation on 429 rate limits, unit tested~~
- [x] ~~`server/src/agent/runAgent.ts` — the tool-use loop~~
- [x] ~~`server/src/agent/tools.ts` — the 9 tool schemas + handlers~~ — originally built
      against `shared/src/types/` stand-ins (`types.local.ts`) and stubbed data
      (`stubData.ts`); both deleted as of 2026-09-04 — `tools.ts` now imports the 5 real
      `services/*.ts` + `@shared/types` directly (confirmed)
- [x] ~~`server/src/routes/v1/agent.routes.ts` + `agent.controller.ts` — `POST /api/v1/agent/chat`~~
      — ⚠️ built against `ARCHITECTURE.md`'s `{message, history}`/`{reply, mutated}` contract;
      see `TASKS_HRITTIKA.md`'s doc-conflict note — a newer revision of that file describes a
      different `{messages}`/`{response}` shape that was never reflected in `ARCHITECTURE.md`
- [x] ~~Tool handlers return structured errors (`{ error: "..." }`), never raw exceptions~~
- [x] ~~`client/src/features/campus/ChatPanel.tsx` — now Shads' — reconcile the contract
      conflict above before wiring it up~~ — resolved to `ARCHITECTURE.md`'s
      `{message, history}` → `{reply, mutated}`; `agentService.ts`/`ChatPanel.tsx` and
      `agent.controller.ts` agree on that shape (a narrower field-name bug inside it was
      found 2026-09-04 — see below, not the same shape conflict)
- [x] ~~Wire tool handlers to Arko's real services now that his branch is merged to `main` —
      swap `types.local.ts` → `@shared/types` and `stubData.ts` → `services/*.ts` (same
      method names/signatures by design, so this is an import-line change, not a rewrite)~~
      — done, both files deleted, confirmed via `tools.ts` imports 2026-09-04
- [x] ~~Test every query in `sample_queries/sample_queries.md`, plus the shadow-path cases:
      nil input, empty result, booking conflict, unauthorized action~~ — `vitest` suite is
      real and passing (85/85 tests across 10 files as of 2026-09-04, up from the 41
      recorded here). The "live against the real Gemini API" half needs a caveat: a
      2026-09-04 re-run against the actually-running server got 5/9 sample queries
      confirmed live before hitting Gemini's free-tier daily quota (20 req/day/key), and
      surfaced a real bug — `agentService.ts` sends chat history as `{role, content}` but
      `agent.validator.ts` requires `{role, text}`, so every 2nd+ turn of a conversation
      (incl. the vague-booking clarify-then-confirm flow) 400s and silently falls back to
      a hardcoded keyword-bot instead of the real agent. Full detail + fix suggestion in
      `TASKS_HRITTIKA.md`'s "2026-09-04 live-verification pass" section — not yet fixed.

---

## Integration (all 3, last ~30 min)

- [ ] Shads' pages and Hrittika's agent both point at Arko's real API (swap out any mocks)
- [ ] Full walkthrough: edit a record via the dashboard → immediately ask the agent →
      confirm the answer reflects the edit (most graded behavior in the brief)
- [ ] Walk every `sample_queries/sample_queries.md` query live
- [ ] Test demo-creds card → one-tap login → correct role routing
- [ ] `README.md` — overview, tech stack, setup commands, `.env` keys, example agent questions
- [ ] Final pass against `SUBMISSION.md`

## Verification (per person, before integration)

- **Arko** — curl every endpoint against seeded data, verify Supabase Auth login/signup/reset
- **Shads** — exercise every CRUD action + auth flow + chat UI against mocked data, verify
  mobile viewport (360px) for all 18 routes
- [x] ~~**Hrittika** — run every `sample_queries.md` query against stubbed tool responses,
  verify shadow-path cases~~ — done, plus live smoke tests against the real Gemini API
  (see `TASKS_HRITTIKA.md`)

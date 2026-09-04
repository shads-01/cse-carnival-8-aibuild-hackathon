# CampusOS — Task Split (Arko / Shads / Hrittika) — v4

Deadline: **8:30 PM, 4 September 2026**. Full architecture and rationale: [`PLAN.md`](./PLAN.md).

> **v4 changes:** monorepo is `client/` + `server/` + `shared/` (not `backend/` + `frontend/`);
> styling = vanilla CSS Ocean Glass tokens (not Tailwind/shadcn); auth = Supabase Auth
> (not custom JWT); routes = `/admin/*` + `/app/*` (not `/dashboard/*`); 18 pages total;
> Shads owns all UI including chat; approval flow for room bookings; notifications system.

Goal: all three work **in parallel with zero blocking dependencies**. Agree the contract
once, then each own a track nobody else touches until the final integration step.

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
      `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`,
      `VITE_SUPABASE_ANON_KEY` — **Arko owns this**
- [ ] **Supabase Auth** — enable email OTP, Google OAuth, password reset in Supabase console — **Arko**
- [ ] **`studentId`** — add `studentId?: string` to `User` + `RegisterPayload` in
      `shared/src/types/user.types.ts` — **Shads**
- [ ] Confirm API route base = `/api/v1/*` for all endpoints — **All**

## Shared contract (do together first, ~15 min)

- [ ] Confirm DB schema (7 tables + notifications): `schedules`, `rooms`, `bookings` (with
      `status`), `events`, `event_registrations`, `announcements`, `assignments`, `notifications`
- [ ] Confirm REST endpoint list under `/api/v1/`: all 5 systems CRUD + bookings + registrations
      + requests (approve/reject) + notifications + agent
- [ ] Confirm agent tool contract: `get_schedule`, `get_assignments`, `get_events`,
      `get_announcements`, `find_available_rooms`, `book_room`, `cancel_booking`,
      `register_for_event`, `cancel_registration`
- [ ] `.env.example` with final key names (no real keys)

---

## Arko — Backend & Data Layer

Owns: Supabase schema, seed script, `server/src/services/*.ts`, REST API, auth setup.

- [ ] **Supabase Auth setup** — enable email OTP, Google OAuth provider, password reset;
      wire `server/src/middlewares/auth.ts` to validate Supabase JWT sessions
- [ ] `.env.example` merge conflict resolution (see pre-flight above)
- [ ] `schema.sql` — 7 tables + FKs + `notifications` table: `id, user_id, type, title, body, link, read, created_at`
- [ ] `db/seed.ts` — load `data/*.json`, split embedded arrays into join tables, upsert on `id`
- [ ] `services/scheduleService.ts`
- [ ] `services/roomService.ts` (+ `findAvailable`, `book` with pending status, `cancelBooking`)
- [ ] `services/eventService.ts` (+ `register`, `cancelRegistration`, capacity check)
- [ ] `services/announcementService.ts`
- [ ] `services/assignmentService.ts`
- [ ] `services/requestService.ts` — **NEW**: get pending, approve (→ confirmed + notification),
      reject (→ rejected + notification), conflict re-check at approve time
- [ ] `services/notificationService.ts` — **NEW**: create, getByUser, markRead, markAllRead
- [ ] All routes under `/api/v1/*` — thin controllers over services, full CRUD on all 5 systems
- [ ] `POST /api/v1/requests/:id/approve`, `POST /api/v1/requests/:id/reject`
- [ ] `GET /api/v1/notifications`, `PUT /api/v1/notifications/:id/read`
- [ ] Booking overlap check + event capacity check live in the service layer
- [ ] Manual test every endpoint against seeded data

## Shads — All Frontend UI

Owns: the React UI for all 18 pages, chat panel, design system, auth flows. Build against
mocked JSON matching the contract — you don't need Arko's server running to start.

- [ ] **Design system** — rewrite `client/src/index.css` with "Ocean Glass" tokens
      (Style 5 Ocean Depth palette + Style 3 Apple Liquid Glass treatment), dark + light mode
- [ ] Update common components (Button, Input, Card, Modal) to use new glass tokens
- [ ] **New common components**: DataTable, RecordDialog, ConfirmDialog, StatusBadge,
      StatCard, Skeleton, Toast, EmptyState, ThemeToggle, NotificationBell
- [ ] **Chat components**: ChatPanel, ChatBubble, QuickChips, TypingIndicator
- [ ] **Auth components**: OtpFlow (shared between signup + forgot)
- [ ] **Layout components**: AdminLayout (sidebar + Outlet), StudentLayout (navbar + tabs + Outlet),
      AuthLayout (centered card), AdminSidebar, StudentNavbar, StudentBottomTabs
- [ ] **8 client services** cloning the `userService.ts` pattern: schedules, rooms, events,
      announcements, assignments, requests, notifications, agent
- [ ] **Routing**: AppRoutes with nested layout routes, RoleGuard (auth + role), SmartRedirect
- [ ] **Auth pages**: LoginPage (role tabs + Google + demo-creds card), SignupPage
      (edu email → OTP → profile + studentId), ForgotPage (email → OTP → reset)
- [ ] **Admin pages (8)**: Overview, Schedules, Rooms, Events, Announcements, Assignments,
      Requests (approval queue), Chat
- [ ] **Student pages (7)**: Home (countdown + timeline + deadlines), Schedule (read-only grid),
      Events (one-tap register + capacity bars), Announcements (priority filter),
      Assignments (urgency badges), Activity (my requests + registrations), Chat (quick-prompt chips)
- [ ] NotificationBell dropdown with deep-links
- [ ] Toast system (success/error on every mutation)
- [ ] Dark/light theme toggle (persisted to localStorage)
- [ ] Mobile-first responsive: 360px verified first, then tablet, then desktop
- [ ] Every mutation updates local state immediately — no manual refresh
- [ ] Loading / empty / error states for every page

### Non-negotiable rule
Never call Supabase from the frontend for data operations. Everything goes through
`services/*.ts` → Arko's REST routes. Supabase client is used client-side ONLY for auth.

## Hrittika — AI Agent

Owns: tool calling, LLM integration (Google Gemini, native function calling), system prompt.
**Chat UI is now Shads' responsibility** — Hrittika provides the backend endpoint.

- [ ] `agent/systemPrompt.ts` — identity + 4 behavior rules: always read via a tool,
      ask on missing parameter, refuse when unauthorized, confirm before destructive action
- [ ] `agent/llmClient.ts` — Gemini wrapper (`@google/generative-ai`), kept swappable
- [ ] `agent/runAgent.ts` — the tool-use loop
- [ ] `agent/tools.ts` — the 9 tool schemas + handlers, calling `server/src/services/*.ts`
- [ ] `server/src/routes/agent.ts` — `POST /api/v1/agent/chat` (note: `/api/v1/`, not `/api/`)
- [ ] Tool handlers return structured errors (`{ error: "..." }`), never raw exceptions
- [ ] Test every query in `sample_queries/sample_queries.md` + shadow-path cases

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
- **Hrittika** — run every `sample_queries.md` query against stubbed tool responses,
  verify shadow-path cases

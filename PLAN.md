# CampusOS — Implementation Plan (v4, repo-aligned)

Deadline: **8:30 PM, 4 September** (today). Plan is time-boxed to that.

> **v4 changes (repo-aligned):** monorepo structure is `client/` + `server/` + `shared/`
> (npm workspaces); styling is vanilla CSS with "Ocean Glass" design tokens (no Tailwind,
> no shadcn — translucent depth layers with `backdrop-filter: blur(40px)`); auth switches
> to Supabase Auth (OTP + Google OAuth + password reset) over the custom JWT (retained as
> fallback); routes are `/admin/*` + `/app/*` (18 total pages); Shads owns all UI including
> chat; room booking approval flow; notifications system. `ARCHITECTURE.md` is the source of truth.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Express + TypeScript (monorepo: `server/`) | Already scaffolded. Controller→service pattern, Zod validators, `/api/v1` routes. |
| Frontend | React (Vite) + TypeScript + vanilla CSS (monorepo: `client/`) | Ocean Glass design system — translucent depth layers with `backdrop-filter: blur(40px)`. Hand-rolled accessible components and glassmorphic CSS tokens. |
| Shared | TypeScript types + constants (monorepo: `shared/`) | Single source for domain types, Zod schemas, route constants — both sides import from `@shared/types`. |
| Database | Supabase (Postgres) | Real persistent backend, free tier, accessed **only** from Express via service-role key. Frontend uses Supabase client for auth only (OTP/Google/reset). |
| Auth | Supabase Auth | Native OTP signup, Google OAuth, password reset, session management, demo-creds card. Custom JWT kept dormant as fallback. |
| LLM | **Google Gemini** (`@google/genai`, `gemini-2.5-flash`), native function calling | Gemini function calling is mature and fast; API key rotation across `GEMINI_API_KEYS` on rate limit. Isolated behind `agent/llmClient.ts`. |

## Non-negotiable architecture rule

**The agent and the REST API call the same service layer.** Not two copies of "how to read a room," not the agent hitting Supabase directly while routes go through a different path. One `services/*.ts` per system, used by both `routes/*.ts` (dashboard CRUD) and `agent/tools.ts` (agent actions).

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

Mirrors `schema/schema.md`, normalized (not JSONB blobs):

- `schedules` — as-is from schema
- `rooms` — as-is, minus embedded `bookings`
- `bookings` — `id, room_id (FK), booked_by, requester_id, date, start_time, end_time, purpose, status` — separate table; `status` = pending|confirmed|rejected|cancelled (approval flow)
- `events` — as-is, minus embedded `registrations`; `registered` = computed count
- `event_registrations` — `id, event_id (FK), student_id, name`
- `announcements` — as-is
- `assignments` — as-is
- `notifications` — `id, user_id, type, title, body, link, read, created_at` (NEW)

Seed script reads the five JSON files in `data/`, transforms `bookings`/`registrations` arrays into rows in the join tables, and upserts on `id` — safe to re-run.

## File structure (repo reality)

See `ARCHITECTURE.md`'s [Target directory layout](./ARCHITECTURE.md#target-directory-layout)
for the authoritative, up-to-date version (it also marks what already exists from the auth
scaffold vs. what's new). Same shape, real paths:

```
client/src/
  index.css                 # Ocean Glass design system tokens (dark/light)
  App.tsx                   # BrowserRouter + route tree
  components/
    common/                 # Button, Input, Card, Modal, DataTable, StatusBadge,
                           #   StatCard, Toast, Skeleton, EmptyState, ThemeToggle,
                           #   ConfirmDialog, RecordDialog, NotificationBell
    chat/                   # ChatPanel, ChatBubble, QuickChips, TypingIndicator
    auth/                   # OtpFlow
    layout/                 # AdminLayout, StudentLayout, AuthLayout,
                           #   AdminSidebar, StudentNavbar, StudentBottomTabs
  features/                 # Feature modules (schedule/, room/, event/, etc.)
  pages/
    LoginPage.tsx SignupPage.tsx ForgotPage.tsx
    admin/                  # Overview, Schedules, Rooms, Events,
                           #   Announcements, Assignments, Requests, Chat
    student/                # Home, Schedule, Events, Announcements,
                           #   Assignments, Activity, Chat
  routes/                   # AppRoutes, RoleGuard, SmartRedirect
  services/                 # api.ts, authService.ts, 8 domain services
  store/                    # authStore, toastStore, themeStore, notificationStore
  hooks/                    # useAuth, useFetch, useTheme, useNotifications
  config/                   # env.config.ts

server/src/
  app.ts                    # Express app, mounts routes
  config/                   # DB config, env (GEMINI_API_KEYS rotation, Supabase)
  controllers/              # Thin controllers (schedule, room, event, announcement, assignment, agent, request, notification)
  services/                 # One per system — the ONLY layer that talks to Supabase
  routes/v1/                # /api/v1/* routes
  middlewares/              # Auth (Supabase + fallback JWT), role guard, error handler
  validators/               # Zod schemas
  agent/                    # tools.ts, systemPrompt.ts, llmClient.ts (@google/genai), runAgent.ts

shared/src/
  types/                    # User, Schedule, Room, Event, Announcement,
                           #   Assignment, Notification, Booking, Auth types
  constants/                # API_ROUTES, roles, httpStatus
```

## 18-route architecture

| Shell | Route | Page |
|-------|-------|------|
| Public | `/login` | Login (role tabs + Google + demo-creds card) |
| Public | `/signup` | Signup (edu email → OTP → profile + studentId) |
| Public | `/forgot` | Forgot password (email → OTP → new password) |
| Public | `/` + `*` | Smart redirect by auth state + role |
| Admin sidebar | `/admin` | Overview (stats, pending requests, today's schedule) |
| Admin sidebar | `/admin/schedules` | Full CRUD table |
| Admin sidebar | `/admin/rooms` | Register/edit/retire + bookings sub-view |
| Admin sidebar | `/admin/events` | Full CRUD + registrations sub-view |
| Admin sidebar | `/admin/announcements` | Full CRUD |
| Admin sidebar | `/admin/assignments` | Full CRUD |
| Admin sidebar | `/admin/requests` | Room booking approval queue |
| Admin sidebar | `/admin/chat` | AI agent chat |
| Student navbar | `/app` | Home (countdown, timeline, deadlines, events, requests) |
| Student navbar | `/app/schedule` | Read-only weekly grid |
| Student navbar | `/app/events` | One-tap register + capacity bars |
| Student navbar | `/app/announcements` | Priority filter |
| Student navbar | `/app/assignments` | Urgency badges |
| Student navbar | `/app/activity` | My requests + registrations + cancel |
| Student navbar | `/app/chat` | AI agent + sample_queries quick-prompt chips |

## Agent tools (scope: read + the actions the brief names)

Read tools: `get_schedule`, `get_assignments`, `get_events`, `get_announcements`.
Action tools: `find_available_rooms(date, start_time, end_time, min_capacity?, equipment?)`, `book_room(room_id, date, start_time, end_time, booked_by, purpose)`, `cancel_booking(booking_id, booked_by)`, `register_for_event(event_id, student_id, name)`, `cancel_registration(event_id, student_id)`. Param names match the Postgres columns 1:1 — see `ARCHITECTURE.md`'s [Agent tool contract](./ARCHITECTURE.md#agent-tool-contract).

System prompt rules (map to the 4 agent sub-scores):
1. Never answer from memory — always call a read tool first for anything data-shaped.
2. If a request is missing a required parameter — **ask**, don't guess.
3. If a request has no matching tool or is unauthorized — **refuse**, state why.
4. Before a destructive/irreversible action — restate what will happen, proceed only on clear instruction.

## Approval flow (room bookings only)

- Student books → `status: 'pending'` → slot is reserved (conflict-checked at book time)
- Admin approves → `status: 'confirmed'` → notification to requester
- Admin rejects → `status: 'rejected'` → notification with reason
- Admin self-booking → instant `status: 'confirmed'`
- `approvalMode` hedge flag in `env.config.ts`: if Arko's approval endpoints don't land, set `false` → bookings go instant, Requests page degrades to history

## Realtime requirement ("no manual refresh")

Within *this* client, after any add/edit/delete/book/register, the UI must reflect it immediately from the mutation's response — no reload. No websockets/polling needed for the rubric as written.

## Build order (time-boxed against 8:30 PM)

| Phase | Time | Owner | Output |
|---|---|---|---|
| 0. Setup & Pre-flight | 15 min | All | Workspace scaffold landed; `.env.example` unified, Supabase Auth setup, domain types |
| 1. Design system | 45 min | Shads | Ocean Glass CSS tokens, updated common components |
| 2. Routing + layouts | 30 min | Shads | AdminLayout, StudentLayout, 18 placeholder pages |
| 3. Auth pages | 40 min | Shads | Login, Signup, Forgot (Supabase Auth) |
| 4. Shared types + services | 45 min | Shads+Arko | 5 system types, 8 client services, extended API_ROUTES |
| 5. Admin CRUD pages | 60 min | Shads | 5 CRUD tables + Overview + Requests |
| 6. Student pages | 50 min | Shads | Home, Schedule, Events, Announcements, Assignments, Activity |
| 7. Chat UI | 35 min | Shads | ChatPanel + agent integration + quick-prompt chips |
| 8. Agent backend | 60 min | Hrittika | tools, systemPrompt, runAgent, LLM client (`@google/genai` key rotation) |
| 9. Notifications + polish | 25 min | Shads | NotificationBell, animations, responsive pass |
| 10. Integration + test | 30 min | All | Real API, sample_queries walkthrough, demo-creds flow |

Total: ~7h, parallelized across 3 people ≈ 3.5h wall clock.

## Pre-flight fixes (blocking — before any page work)

1. **`.env.example`** — merge conflict markers must be resolved into one file: `PORT=5000`, `NODE_ENV`, `CLIENT_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEYS`, `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
2. **Supabase Auth** — bypass custom JWT, wire OTP + Google + reset
3. **`studentId`** — add to `User` + `RegisterPayload` in `shared/src/types/`
4. **5-system CRUD endpoints** under `/api/v1/*`
5. **Approval endpoints** — `/api/v1/requests`, approve/reject
6. **Notifications table** + endpoints
7. **Agent route** at `/api/v1/agent/chat`

## Shadow-path coverage

- **nil input** — tool handler returns validation error → agent asks a clarifying question
- **empty result** — agent says so plainly, offers to relax a constraint
- **booking conflict** — service layer checks overlap, returns conflict → agent relays
- **unauthorized** — cancel/register targeting someone else's record → refuse with reason
- **at capacity** — event full → agent says so, doesn't register

## README requirements (per SUBMISSION.md)

- [ ] One-paragraph overview
- [ ] Tech stack (Express/TS, React/Vite/TS, Supabase, Gemini)
- [ ] Exact setup commands (`npm install` at the repo root installs all workspaces, `npm run dev` runs `server`+`client` concurrently)
- [ ] Every `.env` key explained (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEYS`, `PORT`), no real keys committed
- [ ] Example questions to ask the agent

## Hedge flags

| Flag | Effect when `false` |
|------|-------------------|
| `approvalMode` | Room bookings go instant (no pending), Requests page = booking history |
| Supabase Auth | Fall back to existing JWT with hardcoded demo accounts |
| Agent endpoint | ChatPanel shows mock responses + "AI agent connecting..." |

## Risks

- **Time is the actual constraint**, not any technical unknown.
- `.env.example` merge conflict blocks all local dev — fix first.
- Auth migration (JWT → Supabase) is the biggest integration risk — hedge with fallback.

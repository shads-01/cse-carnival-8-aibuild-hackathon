# AGENTS.md — CampusOS

Guidance for any AI coding agent (or human) working in this repo. Full rationale and the
time-boxed build order live in [`PLAN.md`](./PLAN.md) — read that first if you're
implementing from scratch. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full system
design: data model, REST/agent-tool contracts, and a request-lifecycle trace. This file is
the durable reference for conventions once code exists.

**Current state (updated 2026-09-04):** the directory layout is **not** `backend/`/
`frontend/` as originally planned — it's an npm-workspaces monorepo, `client/` + `server/` +
`shared/`, scaffolded with generic auth/user boilerplate that predates the CampusOS domain.
`server/src/db/schema.sql` (the real 7-table schema) is the one piece of the actual domain
that exists. Start at Phase 1 in `PLAN.md` (Phase 0's scaffold already landed, just not in
the shape `PLAN.md` describes). See `ARCHITECTURE.md`'s
[status banner](./ARCHITECTURE.md#status-as-of-this-writing--read-this-first),
[open decisions](./ARCHITECTURE.md#open-decisions--risks) (why the layout changed), and
[build-phases table](./ARCHITECTURE.md#build-phases--current-status) before assuming
otherwise, and update both this note and that table as phases land.

## What this repo is

CampusOS: a campus data dashboard (5 systems: schedules, rooms, events, announcements,
assignments) plus an AI agent that reads/acts on the same live data via real tool calling.
Full spec: [`PROBLEM_STATEMENT.md`](./PROBLEM_STATEMENT.md). Judged against
[`sample_queries/sample_queries.md`](./sample_queries/sample_queries.md) and the scoring
table in `PROBLEM_STATEMENT.md`.

## The one architecture rule that matters

**Every data access — dashboard CRUD and agent tool calls alike — goes through the same
`services/*.ts` layer.** Never let `agent/tools.ts` query Supabase directly, and never let
a route handler skip the service layer "just this once." This is what makes "the agent
always reads live data" true structurally instead of something that quietly breaks the
first time someone adds a shortcut. If you're adding a new data operation, it belongs in
a service function first, then gets called from a route and/or a tool — never written
twice.

```
routes/*.ts  ──┐
                ├──►  services/*.ts  ──►  Supabase
agent/tools.ts ─┘        (single source of truth)
```

## Directory layout

npm workspaces (`shared`, `server`, `client`), root `package.json`. Full breakdown —
including what already exists from the auth scaffold vs. what's new for the CampusOS
domain — is in `ARCHITECTURE.md`'s
[Target directory layout](./ARCHITECTURE.md#target-directory-layout). Summary:

```
server/src/
  db/            schema.sql (done, 7 tables), seed.ts (loads data/*.json — not yet written)
  services/      one file per system — the only layer that talks to Supabase
  controllers/   parse req, call service, format response — one per system
  routes/v1/     thin Zod-validated routers over controllers/, one per system + agent.routes.ts
  agent/         tools.ts (schemas + handlers calling services/), systemPrompt.ts,
                 llmClient.ts (swappable LLM wrapper), runAgent.ts (tool-use loop)
client/src/
  features/campus/  one *Section.tsx per system (table + add/edit dialog + delete),
                     ChatPanel.tsx
  services/          campusService.ts — typed functions calling /api/v1/* through api.ts (Axios)
  store/             campusStore.ts (Zustand) — the only thing sections read data from,
                     and what ChatPanel.tsx refetches into after a mutating agent reply
```

## Running it

```bash
npm install     # installs all three workspaces from the repo root
npm run dev     # runs server (:5000, /api/v1/...) + client (:5173) concurrently
```

Required env vars live in a single `.env` at the **repo root** (see `.env.example`, also
at the root): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` (the confirmed
LLM provider — see `ARCHITECTURE.md`'s Stack section — wired into `llmClient.ts`), `PORT`,
plus the `VITE_`-prefixed subset `client/` needs at build time. Full list in
`ARCHITECTURE.md`'s [Environment variables](./ARCHITECTURE.md#environment-variables).
`server/src/config/index.ts` loads and validates it from the repo root — there is no
separate `server/.env`. The Supabase service-role key is backend-only — never ship it to
the client bundle or use it in client-side code.

## Conventions

- Task-tracking: in `tasks.md` and the `TASKS_*.md` files, when you finish a checklist item
  mark it done AND strike it through — `- [x] ~~task text~~` — not just a checked box. Makes
  progress readable at a glance for both humans and agents picking this up mid-build.
- TypeScript everywhere, strict mode on.
- Every mutation (add/edit/delete/book/register/cancel) updates the calling client's UI
  state immediately from the response — no manual refresh, per the brief. No polling or
  websockets needed to satisfy this; that's a same-client concern, not a multi-client
  broadcast requirement.
- Agent tool handlers return structured errors (`{error: "..."}`), never throw raw
  exceptions into the LLM loop — the agent needs a clean signal to relay ("that room's
  already booked then") instead of a stack trace.
- Booking/registration conflict checks (room already booked, event at capacity) live in
  the service layer, not in the agent's tool description — the agent shouldn't be trusted
  to self-police capacity, the DB-backed service should enforce it every time.
- Keep the agent's tool surface to what the brief actually asks for: reads across all 5
  systems, plus book/cancel/register/cancel-registration. Don't wire full CRUD into the
  agent unless everything else is done and there's time left — it multiplies the edge
  cases judges can probe (auth, destructive actions) for marks the rubric doesn't
  allocate there.

## Things not to do

- Don't add a second database or cache in front of Supabase "for speed" — freshness is
  directly graded (10 marks); anything that can go stale is a liability, not an
  optimization.
- Don't let the agent guess a missing parameter (time, room, capacity) — it must ask.
  Don't let it silently perform a destructive/identity-sensitive action without the
  request clearly authorizing it — it must refuse and say why.
- Don't commit `.env` or real API keys. `.env.example` is the template.

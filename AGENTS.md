# AGENTS.md — CampusOS

Guidance for any AI coding agent (or human) working in this repo. Full rationale and the
time-boxed build order live in [`PLAN.md`](./PLAN.md) — read that first if you're
implementing from scratch. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full system
design: data model, REST/agent-tool contracts, and a request-lifecycle trace. This file is
the durable reference for conventions once code exists.

**Current state:** nothing is scaffolded yet — no `backend/` or `frontend/` directory
exists. Only `data/` (seed JSON), `schema/`, `sample_queries/`, and the planning docs are
present. Start at Phase 0 in `PLAN.md`. See `ARCHITECTURE.md`'s
[status banner](./ARCHITECTURE.md#status-as-of-this-writing--read-this-first) and
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

```
backend/src/
  db/            supabase client, schema.sql, seed.ts (loads data/*.json)
  services/      one file per system — the only layer that talks to Supabase
  routes/        thin controllers over services/, one file per system + agent.ts
  agent/         tools.ts (schemas + handlers calling services/), systemPrompt.ts,
                 llmClient.ts (swappable LLM wrapper), runAgent.ts (tool-use loop)
frontend/src/
  pages/         Dashboard.tsx
  components/    one *Section.tsx per system (table + add/edit dialog + delete),
                 ChatPanel.tsx
  lib/api.ts     typed fetch wrapper — the only thing components use to hit the backend
```

## Running it

```bash
# backend
cd backend && npm install && npm run seed && npm run dev

# frontend (separate terminal)
cd frontend && npm install && npm run dev
```

Required env vars live in a single `.env` at the **repo root** (see `.env.example`, also
at the root): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY` (the confirmed
LLM provider — see `ARCHITECTURE.md`'s Stack section — wired into `llmClient.ts`), `PORT`.
The backend loads it from there (e.g. `dotenv.config({ path: '../.env' })` from
`backend/src`, or run `npm` scripts with the working directory set to the repo root) —
there is no separate `backend/.env`. The Supabase service-role key is backend-only — never
ship it to the frontend bundle or use it in client-side code.

## Conventions

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

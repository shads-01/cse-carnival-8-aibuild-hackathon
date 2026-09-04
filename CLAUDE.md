# CLAUDE.md — CampusOS

Claude Code-specific orientation for this repo. See [`AGENTS.md`](./AGENTS.md) for the
architecture rule and conventions that apply to any agent, [`ARCHITECTURE.md`](./ARCHITECTURE.md)
for the full system design (data model, REST/tool contracts, a request-lifecycle trace), and
[`PLAN.md`](./PLAN.md) for the time-boxed build order and rationale. Read all three before
making non-trivial changes here — **as of now nothing is scaffolded** (no `backend/` or
`frontend/` directory exists yet); see `ARCHITECTURE.md`'s status banner before assuming
otherwise.

## Context

This is a hackathon submission (AI Build Hackathon, deadline 8:30 PM, 4 September) built
against [`PROBLEM_STATEMENT.md`](./PROBLEM_STATEMENT.md). Everything here is optimized for
*shipping a fully working submission on that clock*, not for long-term platform design —
if a suggestion trades build speed for architectural purity, favor build speed unless it
risks one of the graded criteria (data freshness, CRUD persistence, or the agent's
ask/refuse judgment).

## Stack

Express + TypeScript (backend) · React + Vite + TypeScript + Tailwind/shadcn (frontend) ·
Supabase/Postgres (database, backend-only access via service-role key) · Google Gemini
via native function calling (agent). Provider is swappable — see `backend/src/agent/llmClient.ts`.

## Commands (once scaffolded — see PLAN.md Phase 0-1)

```bash
cd backend && npm install && npm run seed && npm run dev    # API on $PORT
cd frontend && npm install && npm run dev                    # Vite dev server
```

No test runner is planned given the time budget — verification is the manual walk-through
in PLAN.md Phase 6 (every query in `sample_queries/sample_queries.md`, plus the shadow-path
cases listed there: nil input, empty result, booking conflict, unauthorized action). If you
add automated tests, keep them fast — this isn't the place for a slow suite eating the
clock.

## The rule that governs every change here

Data access has exactly one path: `services/*.ts`. Dashboard routes and agent tools both
call into it; neither talks to Supabase directly. Before adding or editing anything that
reads or writes schedules/rooms/events/announcements/assignments, check whether the
service function already exists — extend it, don't duplicate it in a route handler or a
tool handler. See `AGENTS.md` for the full rationale (it's what makes "agent always reads
live data" true by construction).

## Status tracking

This file describes the *planned* shape from `PLAN.md`. As phases land, update this
section **and** the matching table in [`ARCHITECTURE.md`](./ARCHITECTURE.md#build-phases--current-status)
so the next session (agent or human) knows where things actually stand rather than
re-deriving it from a stale plan doc:

- [ ] Phase 0 — Supabase project + scaffolding
- [ ] Phase 1 — services/ data layer + seed script
- [ ] Phase 2 — REST routes
- [ ] Phase 3 — Dashboard UI
- [ ] Phase 4 — Agent backend (tools + tool-use loop)
- [ ] Phase 5 — Chat UI
- [ ] Phase 6 — Test against sample_queries.md
- [ ] Phase 7 — README + polish

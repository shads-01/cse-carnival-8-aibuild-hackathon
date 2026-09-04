# CLAUDE.md — CampusOS

Claude Code-specific orientation for this repo. See [`AGENTS.md`](./AGENTS.md) for the
architecture rule and conventions that apply to any agent, [`ARCHITECTURE.md`](./ARCHITECTURE.md)
for the full system design (data model, REST/tool contracts, a request-lifecycle trace), and
[`PLAN.md`](./PLAN.md) for the time-boxed build order and rationale. Read all three before
making non-trivial changes here — **the directory layout is `client/` + `server/` +
`shared/` (npm workspaces), not `backend/`/`frontend/` as originally planned** (a teammate's
push landed the workspace scaffold with generic auth/user boilerplate; the team decided
2026-09-04 to build the CampusOS domain into it rather than restart). See
`ARCHITECTURE.md`'s [status banner](./ARCHITECTURE.md#status-as-of-this-writing--read-this-first)
and [Open decisions](./ARCHITECTURE.md#open-decisions--risks) before assuming otherwise.

## Context

This is a hackathon submission (AI Build Hackathon, deadline 8:30 PM, 4 September) built
against [`PROBLEM_STATEMENT.md`](./PROBLEM_STATEMENT.md). Everything here is optimized for
*shipping a fully working submission on that clock*, not for long-term platform design —
if a suggestion trades build speed for architectural purity, favor build speed unless it
risks one of the graded criteria (data freshness, CRUD persistence, or the agent's
ask/refuse judgment).

## Stack

Express + TypeScript in `server/` · React + Vite + TypeScript in `client/` (hand-rolled CSS
components, Axios + Zustand — not Tailwind/shadcn, see `ARCHITECTURE.md`'s Open decisions) ·
`shared/` for cross-workspace types (`@shared/types`) · Supabase/Postgres (database,
backend-only access via service-role key) · Google Gemini via native function calling
(agent), Google GenAI SDK (`@google/genai`). Provider is swappable — see
`server/src/agent/llmClient.ts` (not yet written).

## Commands (workspace scaffold exists; services/routes/agent below are Phase 1+)

```bash
npm install       # from repo root — installs shared, server, client workspaces
npm run dev        # runs server (:5000, /api/v1/...) + client (:5173) concurrently
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

- [x] Phase 0 — Supabase project + scaffolding (workspace scaffold + `schema.sql` landed 2026-09-04)
- [x] Phase 1 — services/ data layer + seed script (5 services + seed + conflict handling)
- [x] Phase 2 — REST routes (all 5 routers + controllers mounted under `/api/v1`)
- [x] Phase 3 — Dashboard UI (18 pages built with Ocean Glass design tokens, dark/light modes)
- [ ] Phase 4 — Agent backend (tools + tool-use loop; `llmClient.ts` key-rotation done)
- [x] Phase 5 — Chat UI (`ChatPanel.tsx` with quick chips from `sample_queries.md` integrated into admin/student)
- [ ] Phase 6 — Test against sample_queries.md
- [ ] Phase 7 — README + polish

# Hrittika (me) — AI Agent

Deadline: **8:30 PM, 4 September**. Full detail: [`tasks.md`](./tasks.md) · [`PLAN.md`](./PLAN.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md)

> When you finish a checklist item below, check it **and** strike it through: `- [x] ~~item~~`.

You own: tool calling, LLM integration (**Google Gemini**, native function calling), chat UI. Build tool handlers against the agreed service signatures, stubbing data calls until Arko's services are live.

> **2026-09-04 update:** paths below now live under `server/src/agent/` and
> `client/src/features/campus/` (npm workspace `server`/`client`, not `backend`/`frontend`)
> — see `ARCHITECTURE.md`'s [Target directory layout](./ARCHITECTURE.md#target-directory-layout)
> and [Open decisions](./ARCHITECTURE.md#open-decisions--risks). Also: your tool handlers and
> `ChatPanel.tsx` will import domain types from `@shared/types` — that package doesn't have
> `Schedule`/`Room`/`Event`/etc. yet, so check `tasks.md`'s Shared contract section before
> writing real (non-mocked) code against them.

## Initial setup — my part (do first, ~15 min, with Arko + Shads)
- [ ] Drive the shared-contract conversation: confirm the DB schema (7 tables — `schema/schema.md`), REST endpoint shapes, and the 9 agent tool signatures below
- [x] ~~Draft the initial `db/schema.sql` (7 tables + FKs: `schedules`, `rooms`, `bookings`, `events`, `event_registrations`, `announcements`, `assignments`) for Arko to review and build `services/*.ts` against~~
- [ ] Get a `GEMINI_API_KEY` from Google AI Studio
- [x] ~~Get `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from Arko once the Supabase project exists (backend-only — never in frontend code)~~ — obtained, connection verified live
- [x] ~~Commit the filled-out `.env.example` reflecting final key names: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `PORT` (placeholders only, no real keys)~~
- [ ] Confirm the non-negotiable rule with both: agent tools call `services/*.ts`, never Supabase directly

## Agent tool contract (confirm with Arko before he builds services)
`get_schedule`, `get_assignments`, `get_events`, `get_announcements`, `find_available_rooms(date, start_time, end_time, min_capacity?, equipment?)`, `book_room(room_id, date, start_time, end_time, booked_by, purpose)`, `cancel_booking(booking_id, booked_by)`, `register_for_event(event_id, student_id, name)`, `cancel_registration(event_id, student_id)`

## Your build
- [x] ~~`server/src/agent/systemPrompt.ts` — identity + 4 behavior rules: never answer from memory (always call a read tool), ask on a missing required parameter, refuse when unauthorized or no tool matches, confirm before a destructive/irreversible action~~
- [x] ~~`server/src/agent/llmClient.ts` — Google GenAI SDK (`@google/genai`) wrapper, kept swappable~~
- [x] ~~`server/src/agent/runAgent.ts` — the tool-use loop~~
- [x] ~~`server/src/agent/tools.ts` — the 9 tool schemas + handlers, calling `services/*.ts` (stubbed in `stubData.ts`/`types.local.ts` until Arko's branch is merged — see integration note below)~~
- [x] ~~`server/src/routes/v1/agent.routes.ts` + `agent.controller.ts` — `POST /api/v1/agent/chat`~~
- [ ] `client/src/features/campus/ChatPanel.tsx` — message list + input, calls `/api/v1/agent/chat`, refetches the matching `campusStore` (Zustand) slices named in the response's `mutated` field — blocked on Shads' `campusStore.ts` landing
- [x] ~~Tool handlers return structured errors (`{ error: "..." }`), never a raw exception into the LLM loop~~

> **2026-09-04 note:** live-tested against the real Gemini API — `gemini-2.5-flash` now
> 404s ("no longer available to new users"); switched `runAgent.ts` to `gemini-3.6-flash`
> per the API's own error message. That model also requires echoing each function-call
> part's `thoughtSignature` back verbatim on the next turn, so `runAgent.ts` replays
> `response.candidates[0].content` as-is instead of reconstructing the turn from
> `response.functionCalls`. Every file above has a colocated `*.test.ts` (vitest); all 41
> server tests pass (`npm run test --workspace=server`).

## Verify before integration
Run every query in `sample_queries/sample_queries.md` against stubbed tool responses, plus the shadow-path cases: nil input, empty result, booking conflict, unauthorized action.

## Integration (last ~30 min, all 3 together)
- [ ] Wire tool handlers to Arko's real services — the one point where your track touches his
- [ ] Full walkthrough: edit a record via Shads' dashboard → immediately ask the agent → confirm the answer reflects the edit (the most graded behavior in the brief)
- [ ] `README.md` — overview, tech stack, setup commands, every `.env` key, example agent questions
- [ ] Final pass against `SUBMISSION.md`

# Hrittika (me) — AI Agent

Deadline: **8:30 PM, 4 September**. Full detail: [`tasks.md`](./tasks.md) · [`PLAN.md`](./PLAN.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md)

> When you finish a checklist item below, check it **and** strike it through: `- [x] ~~item~~`.

You own: tool calling, LLM integration (**Google Gemini**, native function calling), chat UI. Build tool handlers against the agreed service signatures, stubbing data calls until Arko's services are live.

## Initial setup — my part (do first, ~15 min, with Arko + Shads)
- [ ] Drive the shared-contract conversation: confirm the DB schema (7 tables — `schema/schema.md`), REST endpoint shapes, and the 9 agent tool signatures below
- [x] ~~Draft the initial `db/schema.sql` (7 tables + FKs: `schedules`, `rooms`, `bookings`, `events`, `event_registrations`, `announcements`, `assignments`) for Arko to review and build `services/*.ts` against~~
- [ ] Get a `GEMINI_API_KEY` from Google AI Studio
- [x] ~~Get `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from Arko once the Supabase project exists (backend-only — never in frontend code)~~ — obtained, connection verified live
- [x] ~~Commit the filled-out `.env.example` reflecting final key names: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `PORT` (placeholders only, no real keys)~~
- [ ] Confirm the non-negotiable rule with both: agent tools call `services/*.ts`, never Supabase directly

## Agent tool contract (confirm with Arko before he builds services)
`get_schedule`, `get_assignments`, `get_events`, `get_announcements`, `find_available_rooms(date, start, end, min_capacity?, equipment?)`, `book_room(room_id, date, start, end, booked_by, purpose)`, `cancel_booking(booking_id)`, `register_for_event(event_id, student_id, name)`, `cancel_registration(event_id, student_id)`

## Your build
- [ ] `agent/systemPrompt.ts` — identity + 4 behavior rules: never answer from memory (always call a read tool), ask on a missing required parameter, refuse when unauthorized or no tool matches, confirm before a destructive/irreversible action
- [ ] `agent/llmClient.ts` — Gemini wrapper (`@google/generative-ai`), kept swappable
- [ ] `agent/runAgent.ts` — the tool-use loop
- [ ] `agent/tools.ts` — the 9 tool schemas + handlers, calling `services/*.ts` (stub these until Arko's are live)
- [ ] `routes/agent.ts` — `POST /api/agent/chat`
- [ ] `ChatPanel.tsx` — message list + input, calls `/api/agent/chat`
- [ ] Tool handlers return structured errors (`{ error: "..." }`), never a raw exception into the LLM loop

## Verify before integration
Run every query in `sample_queries/sample_queries.md` against stubbed tool responses, plus the shadow-path cases: nil input, empty result, booking conflict, unauthorized action.

## Integration (last ~30 min, all 3 together)
- [ ] Wire tool handlers to Arko's real services — the one point where your track touches his
- [ ] Full walkthrough: edit a record via Shads' dashboard → immediately ask the agent → confirm the answer reflects the edit (the most graded behavior in the brief)
- [ ] `README.md` — overview, tech stack, setup commands, every `.env` key, example agent questions
- [ ] Final pass against `SUBMISSION.md`

# Hrittika — AI Agent (v4)

Deadline: **8:30 PM, 4 September**. Full detail: [`tasks.md`](./tasks.md) · [`PLAN.md`](./PLAN.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md)

> **v4 changes:** Chat UI is now Shads' responsibility — you provide the backend
> endpoint and agent logic. Agent route = `POST /api/v1/agent/chat` (note `/api/v1/`).
> Agent code lives in `server/src/agent/`. All services are in `server/src/services/`.
> When you finish a checklist item below, check it **and** strike it through: `- [x] ~~item~~`.

> **⚠️ 2026-09-04 unresolved doc conflict — read before touching the chat endpoint:**
> this file's "Your build" section (below, from an earlier revision merged as commit
> `574eb4b`) describes `POST /api/v1/agent/chat` as accepting
> `{ messages: [{ role, content }] }`, returning `{ response: string }`, and requiring
> auth. **`ARCHITECTURE.md`'s REST API surface still says `{ message: string, history?:
> ChatTurn[] }` → `{ reply: string, mutated: string[] }`, no auth**, and every doc in this
> repo (including this file's own header) names `ARCHITECTURE.md` as the source of truth.
> The implementation below was built and live-tested against `ARCHITECTURE.md`'s version —
> it was already working end-to-end (see the "Your build" note) before this conflict
> surfaced during a `main` merge, so it wasn't silently rewritten to match the other shape.
> **If Shads' `ChatPanel.tsx` is being built against `{messages}`/`{response}`, that will
> not match this endpoint — reconcile before integration**, either by updating
> `ARCHITECTURE.md` + this endpoint to the `{messages}` shape, or by confirming
> `ChatPanel.tsx` targets `{message, history}` → `{reply, mutated}` instead.

You own: tool calling, LLM integration (**Google Gemini**, native function calling via `@google/genai`),
system prompt, tool-use loop, and the agent controller/route. Build tool handlers against the agreed service signatures,
stubbing data calls until Arko's services are live.

**You do NOT own the Chat UI anymore** — Shads is building `ChatPanel.tsx` and wiring it
to your `POST /api/v1/agent/chat` endpoint. Your deliverable is the endpoint + the agent
logic behind it.

## Initial setup — my part (with Arko + Shads, ~15 min)

- [ ] Confirm agent tool contract: 9 tools (see below)
- [x] ~~Get `GEMINI_API_KEYS` from Google AI Studio (comma-separated list for rate-limit rotation)~~
- [x] ~~Get `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from Arko (backend-only — never in frontend code)~~ — connection verified live
- [x] ~~Draft the initial `server/src/db/schema.sql` (7 tables + FKs)~~ — applied to Supabase
- [x] ~~Fill out `.env.example` with final key names including `GEMINI_API_KEYS`~~
- [ ] Confirm route base = `/api/v1/agent/chat`
- [ ] Confirm the non-negotiable: agent tools call `server/src/services/*.ts`, never Supabase directly

## Agent tool contract (confirm with Arko)

| Tool | Params | Service call |
|------|--------|-------------|
| `get_schedule` | `day?`, `course?` | `scheduleService.getAll(filters)` |
| `get_assignments` | `course?`, `status?` | `assignmentService.getAll(filters)` |
| `get_events` | `status?`, `date?` | `eventService.getAll(filters)` |
| `get_announcements` | `priority?` | `announcementService.getAll(filters)` |
| `find_available_rooms` | `date, start_time, end_time, min_capacity?, equipment?` | `roomService.findAvailable()` |
| `book_room` | `room_id, date, start_time, end_time, booked_by, purpose` | `roomService.book()` |
| `cancel_booking` | `booking_id, booked_by` | `roomService.cancelBooking()` |
| `register_for_event` | `event_id, student_id, name` | `eventService.register()` |
| `cancel_registration` | `event_id, student_id` | `eventService.cancelRegistration()` |

## Your build

- [x] ~~`server/src/agent/systemPrompt.ts` — identity + 4 behavior rules: never answer from memory (always call a read tool), ask on a missing required parameter, refuse when unauthorized or no tool matches, confirm before a destructive/irreversible action~~
- [x] ~~`server/src/agent/llmClient.ts` — Google GenAI SDK (`@google/genai`) wrapper, kept swappable, multi-key rotation on 429 rate limits, unit tested~~
- [x] ~~`server/src/agent/runAgent.ts` — the tool-use loop~~
- [x] ~~`server/src/agent/tools.ts` — the 9 tool schemas + handlers, calling `services/*.ts` (stubbed in `stubData.ts`/`types.local.ts` until Arko's branch is merged — see integration note below)~~
- [x] ~~`server/src/routes/v1/agent.routes.ts` + `agent.controller.ts` — `POST /api/v1/agent/chat`~~ — built against `ARCHITECTURE.md`'s `{message, history}`/`{reply, mutated}` contract; see the doc-conflict note above before assuming this matches `ChatPanel.tsx`
- [ ] `client/src/features/campus/ChatPanel.tsx` — now Shads' — see the v4 change note above
- [x] ~~Tool handlers return structured errors (`{ error: "..." }`), never a raw exception into the LLM loop~~

> **2026-09-04 note:** live-tested against the real Gemini API — `gemini-2.5-flash` now
> 404s ("no longer available to new users"); switched `runAgent.ts` to `gemini-3.6-flash`
> per the API's own error message. That model also requires echoing each function-call
> part's `thoughtSignature` back verbatim on the next turn, so `runAgent.ts` replays
> `response.candidates[0].content` as-is instead of reconstructing the turn from
> `response.functionCalls`. Every file above has a colocated `*.test.ts` (vitest); all 41
> server tests pass (`npm run test --workspace=server`).

## Non-negotiable rules

1. Agent tools call `server/src/services/*.ts`, never Supabase directly
2. Tool handlers return structured errors (`{ error: "..." }`), never raw exceptions
3. The agent must **never guess** a missing parameter — it must ask
4. The agent must **never** silently perform a destructive action without clear authorization

## Verify before integration

Run every query in `sample_queries/sample_queries.md` against stubbed (or real) tool responses:

- [x] ~~"When is my next class?" → calls `get_schedule`, returns correct data~~ — verified live
- [ ] "What assignments do I have due this week?" → calls `get_assignments`, filters by date
- [x] ~~"Book Room 7A02 tomorrow from 3 PM to 5 PM" → calls `book_room`, returns confirmation~~ — verified live
- [ ] "Register me for the Guest Lecture on Deep Learning" → calls `register_for_event`
- [x] ~~Vague request ("book me any room") → agent **asks** for time/capacity/date~~ — verified live
- [x] ~~Conflict (room already booked) → agent relays the conflict, doesn't double-book~~ — verified via vitest (tools.test.ts)
- [x] ~~Unauthorized (cancel someone else's booking) → agent **refuses** with reason~~ — verified live
- [x] ~~At capacity (event full) → agent says so, doesn't register~~ — verified via vitest (tools.test.ts)
- [ ] "I need a room for 5 people with a projector" → calls `find_available_rooms` with filters

## Integration (last ~30 min, all 3 together)

- [ ] Wire tool handlers to Arko's real services — his branch is merged to `main` now;
      swap `types.local.ts` → `@shared/types` and `stubData.ts` → `services/*.ts`
- [ ] **Resolve the request/response shape conflict noted at the top of this file** before
      wiring up `ChatPanel.tsx`
- [ ] Full walkthrough with Shads: edit via dashboard → immediately ask agent → confirm
      the answer reflects the edit
- [ ] Verify Shads' `ChatPanel.tsx` correctly calls `POST /api/v1/agent/chat` and renders responses
- [ ] `README.md` — overview, tech stack, setup commands, `.env` keys, example agent questions
- [ ] Final pass against `SUBMISSION.md`

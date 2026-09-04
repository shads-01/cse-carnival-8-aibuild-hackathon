# Hrittika — AI Agent (v4)

Deadline: **8:30 PM, 4 September**. Full detail: [`tasks.md`](./tasks.md) · [`PLAN.md`](./PLAN.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md)

> **v4 changes:** Chat UI is now Shads' responsibility — you provide the backend
> endpoint and agent logic. Agent route = `POST /api/v1/agent/chat` (note `/api/v1/`).
> Agent code lives in `server/src/agent/`. All services are in `server/src/services/`.
> When you finish a checklist item below, check it **and** strike it through: `- [x] ~~item~~`.

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

All files go in `server/src/`:

- [ ] `server/src/agent/systemPrompt.ts` — identity + 4 behavior rules:
      1. Never answer from memory — always call a read tool first for anything data-shaped
      2. If a request is missing a required parameter (time, room, size) — **ask**, don't guess
      3. If a request has no matching tool, or is unauthorized — **refuse**, state why
      4. Before a destructive/irreversible action — restate what will happen, proceed only
         on clear instruction
- [x] ~~`server/src/agent/llmClient.ts` — Google GenAI SDK (`@google/genai`) wrapper with multi-key rotation on 429 rate limits, unit tested~~
- [ ] `server/src/agent/runAgent.ts` — the tool-use loop:
      1. Send user message + tool declarations to Gemini
      2. If response contains function calls → execute each via tool handlers → send results back
      3. Loop until Gemini returns a text-only response (no more function calls)
      4. Return the final text to the client
- [ ] `server/src/agent/tools.ts` — the 9 tool schemas + handlers:
      - Each handler calls the appropriate `server/src/services/*.ts` function
      - Each handler returns structured data or `{ error: "..." }` — never throw raw exceptions
- [ ] `server/src/routes/v1/agent.routes.ts` + `agent.controller.ts` — `POST /api/v1/agent/chat`:
      - Accepts `{ messages: [{ role: 'user'|'assistant', content: string }] }`
      - Returns `{ response: string }`
      - Authenticates the request (user must be logged in)

## Non-negotiable rules

1. Agent tools call `server/src/services/*.ts`, never Supabase directly
2. Tool handlers return structured errors (`{ error: "..." }`), never raw exceptions
3. The agent must **never guess** a missing parameter — it must ask
4. The agent must **never** silently perform a destructive action without clear authorization

## Verify before integration

Run every query in `sample_queries/sample_queries.md` against stubbed (or real) tool responses:

- [ ] "When is my next class?" → calls `get_schedule`, returns correct data
- [ ] "What assignments do I have due this week?" → calls `get_assignments`, filters by date
- [ ] "Book Room 7A02 tomorrow from 3 PM to 5 PM" → calls `book_room`, returns confirmation
- [ ] "Register me for the Guest Lecture on Deep Learning" → calls `register_for_event`
- [ ] Vague request ("book me any room") → agent **asks** for time/capacity/date
- [ ] Conflict (room already booked) → agent relays the conflict, doesn't double-book
- [ ] Unauthorized (cancel someone else's booking) → agent **refuses** with reason
- [ ] At capacity (event full) → agent says so, doesn't register
- [ ] "I need a room for 5 people with a projector" → calls `find_available_rooms` with filters

## Integration (last ~30 min, all 3 together)

- [ ] Wire tool handlers to Arko's real services
- [ ] Full walkthrough with Shads: edit via dashboard → immediately ask agent → confirm
      the answer reflects the edit
- [ ] Verify Shads' `ChatPanel.tsx` correctly calls `POST /api/v1/agent/chat` and renders responses
- [ ] `README.md` — overview, tech stack, setup commands, `.env` keys, example agent questions
- [ ] Final pass against `SUBMISSION.md`

# Shads — Dashboard Frontend

Deadline: **8:30 PM, 4 September**. Full detail: [`tasks.md`](./tasks.md) · [`PLAN.md`](./PLAN.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md)

You own: the React CRUD UI for all 5 systems. Build against mocked JSON matching the agreed contract — you don't need Arko's server running to start.

## Setup (do first, ~15 min, with the other two)
- [ ] Agree the DB schema (7 tables), REST endpoint shapes, and agent tool signatures — see `schema/schema.md`
- [ ] Get `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from Arko once created (you won't use these directly — frontend never talks to Supabase, just noting the contract is settled)
- [ ] Confirm `.env.example` / API base URL you'll point `lib/api.ts` at

## Your build
- [ ] Vite + React + TypeScript + Tailwind + shadcn/ui scaffold
- [ ] `lib/api.ts` — typed fetch wrapper matching the agreed API contract (the only thing components use to hit the backend)
- [ ] `ScheduleSection.tsx`
- [ ] `RoomSection.tsx` (+ book/cancel UI)
- [ ] `EventSection.tsx` (+ register/cancel UI)
- [ ] `AnnouncementSection.tsx`
- [ ] `AssignmentSection.tsx`
- [ ] Each section: table view + add/edit dialog + delete confirm
- [ ] Every mutation updates local state immediately from the response — no manual refresh, per the brief
- [ ] Loading / empty / error states for every section

## Non-negotiable rule
Never call Supabase from the frontend. Everything goes through `lib/api.ts` → Arko's REST routes.

## Verify before integration
Exercise every CRUD action in the UI against mocked data.

## Integration (last ~30 min, all 3 together)
Swap mocked data for real `fetch` calls once Arko's routes are live — the one point where your track touches his.

# Shads — Dashboard Frontend

Deadline: **8:30 PM, 4 September**. Full detail: [`tasks.md`](./tasks.md) · [`PLAN.md`](./PLAN.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md)

> When you finish a checklist item below, check it **and** strike it through: `- [x] ~~item~~`.

You own: the React CRUD UI for all 5 systems. Build against mocked JSON matching the agreed contract — you don't need Arko's server running to start.

> **2026-09-04 update:** the scaffold that landed is `client/` (not a fresh Vite project you
> create) — npm-workspaces monorepo, see `ARCHITECTURE.md`'s
> [Target directory layout](./ARCHITECTURE.md#target-directory-layout) and
> [Open decisions](./ARCHITECTURE.md#open-decisions--risks). That changes two things below:
> **no Tailwind/shadcn** — reuse the existing hand-rolled components in
> `client/src/components/common/` and `client/src/components/layout/`; and **no
> `lib/api.ts`** — use the existing `client/src/services/api.ts` (Axios) instead, plus a new
> `campusService.ts` alongside it. Everything else on this page still applies.

## Setup (do first, ~15 min, with the other two)
- [ ] Agree the DB schema (7 tables), REST endpoint shapes, and agent tool signatures — see `schema/schema.md`
- [ ] Get `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from Arko once created (you won't use these directly — frontend never talks to Supabase, just noting the contract is settled)
- [ ] Confirm the `VITE_API_BASE_URL` you'll point `campusService.ts` at (already in `.env.example`)

## Your build
- [ ] `client/src/features/campus/` — new folder for the five CampusOS sections, alongside the existing `auth/`, `user/`, `dashboard/` features
- [ ] `campusService.ts` — typed functions matching the agreed API contract, calling `/api/v1/*` through the existing `services/api.ts` Axios instance (the only thing components use to hit the backend)
- [ ] `campusStore.ts` (Zustand, `client/src/store/`) — one slice per resource with a `fetch()` action; sections read from this, and it's what `ChatPanel.tsx` refetches after a mutating agent reply
- [ ] `ScheduleSection.tsx`
- [ ] `RoomSection.tsx` (+ book/cancel UI)
- [ ] `EventSection.tsx` (+ register/cancel UI)
- [ ] `AnnouncementSection.tsx`
- [ ] `AssignmentSection.tsx`
- [ ] Each section: table view + add/edit dialog + delete confirm
- [ ] Every mutation updates local state immediately from the response — no manual refresh, per the brief
- [ ] Loading / empty / error states for every section

## Non-negotiable rule
Never call Supabase from the frontend. Everything goes through `campusService.ts` → Arko's REST routes.

## Verify before integration
Exercise every CRUD action in the UI against mocked data.

## Integration (last ~30 min, all 3 together)
Swap mocked data for real `fetch` calls once Arko's routes are live — the one point where your track touches his.

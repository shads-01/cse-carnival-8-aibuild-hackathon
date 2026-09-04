# Shads — All Frontend UI (v4)

Deadline: **8:30 PM, 4 September**. Full detail: [`tasks.md`](./tasks.md) · [`PLAN.md`](./PLAN.md) · [`ARCHITECTURE.md`](./ARCHITECTURE.md)

> **Scope change from v3:** You now own ALL UI — 18 pages, chat panel, auth flows, design
> system, notifications. Chat UI was previously Hrittika's; she now only provides the
> backend endpoint. Styling = vanilla CSS "Ocean Glass" tokens (not Tailwind/shadcn).
> When you finish a checklist item below, check it **and** strike it through: `- [x] ~~item~~`.

You own: the React frontend for all 18 routes, the "Ocean Glass" design system, auth UI,
chat UI, theme toggle, notifications. Build against mocked JSON matching the agreed
contract — you don't need Arko's server running to start.

## Pre-flight (with the other two, ~15 min)

- [ ] Add `studentId?: string` to `User` + `RegisterPayload` in `shared/src/types/user.types.ts`
- [ ] Confirm `.env.example` / `VITE_API_BASE_URL` = `http://localhost:5000/api/v1`
- [ ] Confirm all API routes are under `/api/v1/*`

## Phase 1 — Design System (45 min)

- [x] ~~Rewrite `client/src/index.css` with Ocean Glass token system (dark + light modes):
      Ocean Depth palette (navy→cyan) rendered through Apple Liquid Glass (translucent,
      `backdrop-filter: blur(40px) saturate(1.8)`, tinted borders)~~
- [x] ~~Update `Button.tsx`, `Input.tsx`, `Card.tsx`, `Modal.tsx` to use glass tokens~~
- [x] ~~Build `ThemeToggle.tsx` — dark/light toggle, persists to `localStorage('campusos-theme')`~~
- [x] ~~Build `StatusBadge.tsx` — semantic pills: pending=amber, confirmed=green, rejected=red~~
- [x] ~~Build `StatCard.tsx` — glass card with icon, label, value, sub-text~~
- [x] ~~Build `Skeleton.tsx` — shimmer loading placeholder~~
- [x] ~~Build `Toast.tsx` + `toastStore.ts` — success/error/info toasts, auto-dismiss 4s~~
- [x] ~~Build `EmptyState.tsx` — friendly message when data is empty~~
- [x] ~~Build `themeStore.ts` — dark/light state persisted to localStorage~~

## Phase 2 — Routing & Layouts (30 min)

- [x] ~~Build `AdminLayout.tsx` — sidebar (glass, collapsible → hamburger on mobile) + `<Outlet />`~~
- [x] ~~Build `AdminSidebar.tsx` — 8 nav items with icons + pending-request badge~~
- [x] ~~Build `StudentLayout.tsx` — top navbar + bottom tab bar (mobile) + `<Outlet />`~~
- [x] ~~Build `StudentNavbar.tsx` — logo, NotificationBell, user avatar, ThemeToggle~~
- [x] ~~Build `StudentBottomTabs.tsx` — Home, Schedule, Events, Chat (mobile only)~~
- [x] ~~Build `AuthLayout.tsx` — centered card on ocean gradient background~~
- [x] ~~Build `RoleGuard.tsx` — not authenticated → `/login`, wrong role → correct home~~
- [x] ~~Build `SmartRedirect.tsx` — `/` + `*` → role-appropriate home or `/login`~~
- [x] ~~Rewrite `AppRoutes.tsx` — full nested route tree (18 routes, 3 layout shells)~~
- [x] ~~Wire placeholder pages for all routes~~
- [x] ~~**Delete** old: `AppLayout.tsx`, `Sidebar.tsx`, `Navbar.tsx`, `Footer.tsx`, `Home.tsx`, `Dashboard.tsx`~~

## Phase 3 — Auth Pages (40 min)

- [x] ~~Build `OtpFlow.tsx` — 6-digit OTP input + resend timer (shared: signup + forgot)~~
- [x] ~~Rebuild `LoginForm.tsx` — Student/Admin role tabs, email+password, Google OAuth button,
      demo-creds card (admin@campusos.edu / alex.dev@campusos.edu, one-tap fill)~~
- [x] ~~Rebuild `RegisterForm.tsx` — multi-step: edu email → OTP → password + name + studentId~~
- [x] ~~Build `ForgotForm.tsx` — email → OTP → new password + confirm~~
- [x] ~~Build `LoginPage.tsx`, `SignupPage.tsx`, `ForgotPage.tsx` with `AuthLayout`~~
- [x] ~~Update `authStore.ts` + `authService.ts` for Supabase Auth (signInWithPassword,
      signInWithOtp, signInWithOAuth, resetPasswordForEmail, verifyOtp)~~

## Phase 4 — Reusable CRUD Components + Services (45 min)

- [x] ~~Build `DataTable.tsx` — sortable, searchable glass table (mobile: card view)~~
- [x] ~~Build `RecordDialog.tsx` — configurable add/edit dialog (glass modal)~~
- [x] ~~Build `ConfirmDialog.tsx` — danger confirm for delete/cancel~~
- [x] ~~Build 8 client services (clone `userService.ts` pattern): schedules, rooms, events,
      announcements, assignments, requests, notifications, agent~~
- [x] ~~Add shared types: `schedule.types.ts`, `room.types.ts`, `event.types.ts`,
      `announcement.types.ts`, `assignment.types.ts`, `notification.types.ts`~~
- [x] ~~Extend `API_ROUTES` in `shared/src/constants/routes.ts` with all systems~~

## Phase 5 — Admin CRUD Pages (60 min)

- [x] ~~`AdminOverview` — stat cards, pending-request counter, today's schedule, announcements~~
- [x] ~~`AdminSchedules` — DataTable + add/edit/delete~~
- [x] ~~`AdminRooms` — DataTable + register/retire + expandable bookings sub-view~~
- [x] ~~`AdminEvents` — DataTable + registrations sub-view + capacity bar~~
- [x] ~~`AdminAnnouncements` — DataTable + priority badges~~
- [x] ~~`AdminAssignments` — DataTable + deadline urgency indicators~~
- [x] ~~`AdminRequests` — approval queue with status tabs, approve/reject, batch approve~~
- [x] ~~Every mutation → toast + immediate UI update from response~~

## Phase 6 — Student Pages (50 min)

- [x] ~~`StudentHome` — next-class countdown, today's timeline, deadlines, announcements,
      events, my-requests horizontal strip, quick actions~~
- [x] ~~`StudentSchedule` — read-only weekly grid (Sun–Thu), day tabs on mobile~~
- [x] ~~`StudentEvents` — card grid + capacity bars + one-tap register (identity prefilled)~~
- [x] ~~`StudentAnnouncements` — priority filter chips, expired dimming~~
- [x] ~~`StudentAssignments` — urgency badges, status filter chips~~
- [x] ~~`StudentActivity` — my requests (cancel-while-pending) + my registrations + cancel~~

## Phase 7 — Chat UI (35 min)

- [x] ~~Build `ChatPanel.tsx` — message list + input + quick-prompt chips~~
- [x] ~~Build `ChatBubble.tsx` — glass user/agent bubbles~~
- [x] ~~Build `QuickChips.tsx` — sample_queries.md verbatim as one-tap buttons~~
- [x] ~~Build `TypingIndicator.tsx` — 3 bouncing dots in glass bubble~~
- [x] ~~Wire to `agentService.ts` → `POST /api/v1/agent/chat`~~
- [x] ~~Build `AdminChat` page + `StudentChat` page (same ChatPanel, different system prompt context)~~

## Phase 8 — Notifications + Polish (25 min)

- [x] ~~Build `NotificationBell.tsx` — bell icon + unread badge + glass dropdown~~
- [x] ~~Build `notificationService.ts` + `notificationStore.ts` — polling for unread count~~
- [x] ~~Deep-links from notifications to relevant items~~
- [x] ~~Animation pass: page transitions (fadeSlideUp), card hover lifts, button ripples~~
- [x] ~~Responsive pass: verify all 18 routes at 360px, 768px, 1280px~~
- [x] ~~Dark/light mode pass: verify all pages in both themes~~

## Non-negotiable rules

1. **Never call Supabase directly for data.** Everything goes through `services/*.ts` → Arko's
   REST routes. Supabase client is used client-side ONLY for auth (signIn/signUp/resetPassword).
2. **Every mutation updates the UI immediately** from the response — no manual refresh.
3. **Mobile-first** — design at 360px, then scale up to tablet and desktop.

## Hedge flags

| Flag | Effect if `false` |
|------|------------------|
| `approvalMode` | Room bookings go instant (no pending state), Requests page = booking history |
| Supabase Auth not ready | Fall back to existing JWT with hardcoded demo accounts |
| Agent endpoint not ready | ChatPanel shows mock responses + "AI agent connecting..." state |

## Cut line (if clock bites)

1. Activity page → merge request strip into Home
2. 404 guard → bare redirect
3. Notification bell → remove
4. Light mode → dark-only

## Verify before integration

- Exercise every CRUD action in the UI against mocked data
- All 18 routes render at 360px without overflow
- Auth flows: login, signup (+ OTP), forgot, Google OAuth, demo-creds card
- Chat: send message → receive response, quick chips work

## Integration (last ~30 min, all 3 together)

- [ ] Swap mocked data for real API calls once Arko's routes are live
- [ ] Full walkthrough: edit dashboard → ask agent → verify freshness
- [ ] Walk every `sample_queries/sample_queries.md` query
- [ ] Test demo-creds flow end-to-end

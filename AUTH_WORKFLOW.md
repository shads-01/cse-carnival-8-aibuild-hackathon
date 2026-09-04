# AUTH_WORKFLOW.md — CampusOS Authentication System

> Full task list and step-by-step workflow for making **Sign In**, **Sign Up**, and
> **Forgot Password** work end-to-end in the CampusOS monorepo.

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Architecture Overview](#2-architecture-overview)
3. [Sign Up Workflow](#3-sign-up-workflow)
4. [Sign In Workflow](#4-sign-in-workflow)
5. [Forgot Password Workflow](#5-forgot-password-workflow)
6. [Identified Issues & Gaps](#6-identified-issues--gaps)
7. [Task Checklist](#7-task-checklist)
8. [File Reference Map](#8-file-reference-map)

---

## 1. Current State Audit

### What EXISTS and works:

| Layer        | File                                        | Status           |
| ------------ | ------------------------------------------- | ---------------- |
| **Types**    | `shared/src/types/auth.types.ts`            | ✅ Complete       |
| **Validator**| `server/src/validators/auth.validator.ts`    | ✅ Complete       |
| **Routes**   | `server/src/routes/v1/auth.routes.ts`        | ✅ 3 routes wired |
| **Controller** | `server/src/controllers/auth.controller.ts`| ✅ login/register/getMe |
| **Service**  | `server/src/services/auth.service.ts`        | ⚠️ No password hashing |
| **User Service** | `server/src/services/user.service.ts`    | ⚠️ No password column stored |
| **Middleware** | `server/src/middlewares/auth.middleware.ts` | ✅ JWT verify + role guard |
| **Client Auth Service** | `client/src/services/authService.ts` | ⚠️ Heavy demo fallbacks |
| **Auth Store** | `client/src/store/authStore.ts`           | ✅ Zustand + localStorage |
| **Login Page** | `client/src/pages/auth/LoginPage.tsx`     | ✅ UI complete    |
| **Signup Page** | `client/src/pages/auth/SignupPage.tsx`   | ⚠️ OTP is simulated |
| **Forgot Page** | `client/src/pages/auth/ForgotPage.tsx`  | ⚠️ Fully simulated |
| **OtpFlow**  | `client/src/components/auth/OtpFlow.tsx`     | ✅ UI complete    |
| **RoleGuard** | `client/src/components/layout/RoleGuard.tsx`| ⚠️ Always passes (no guard) |
| **DB Schema** | `server/src/db/schema.sql`                 | ❌ No `users` table |

### What is BROKEN / MISSING:

1. **No `users` table in the database** — `schema.sql` has 7 tables but no `users`
2. **No password hashing** — `auth.service.ts` stores/checks no password at all
3. **User creation doesn't store password** — `user.service.ts` `createUser()` accepts `password` in DTO but never saves it
4. **RoleGuard is disabled** — returns children unconditionally, no actual auth gate
5. **SmartRedirect sends unauthenticated users to `/admin`** — should go to `/login`
6. **OTP verification is simulated** — `setTimeout` auto-succeeds, no real email
7. **Forgot password is fully mocked** — no backend endpoint, no real reset
8. **Client `authService.login()` hardcodes demo users** — bypasses server for `admin@campus.edu` and `student@campus.edu`
9. **Seed script doesn't seed users** — no demo users in DB

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Vite + React)                    │
│                                                                 │
│  LoginPage.tsx ──→ authService.login() ──→ POST /api/v1/auth/login
│  SignupPage.tsx ──→ authService.register() ──→ POST /api/v1/auth/register
│  ForgotPage.tsx ──→ (TODO: authService.resetPassword())         │
│                                                                 │
│  authStore.ts ←── { token, user } ←── authService response      │
│  localStorage ←── auth_token, auth_user                         │
│                                                                 │
│  api.ts interceptor ──→ attaches Bearer token to every request  │
│  RoleGuard ──→ checks authStore before rendering admin/student  │
└────────────────────────────────────┬────────────────────────────┘
                                     │ HTTP
┌────────────────────────────────────▼────────────────────────────┐
│                        SERVER (Express)                         │
│                                                                 │
│  auth.routes.ts                                                 │
│    POST /login    → validateRequest(loginSchema)    → controller │
│    POST /register → validateRequest(registerSchema) → controller │
│    GET  /me       → authenticate middleware         → controller │
│                                                                 │
│  auth.controller.ts → auth.service.ts → user.service.ts → Supabase
│                                                                 │
│  auth.middleware.ts                                              │
│    authenticate: verify JWT → load user → attach to req.user    │
│    authorize: check req.user.role against allowed roles         │
└────────────────────────────────────┬────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────┐
│                     SUPABASE (PostgreSQL)                        │
│                                                                 │
│  users table (MISSING — must create)                            │
│  Columns: id, email, name, password_hash, role, status,         │
│           avatar_url, created_at, updated_at                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Sign Up Workflow

### Current Flow (Partially Simulated):

```
Step 1: Email Entry
  └─ User enters university email (*.edu enforced client-side)
  └─ Client sets step → 'otp'

Step 2: OTP Verification (SIMULATED)
  └─ OtpFlow.tsx renders 6-digit input
  └─ User enters any 6 digits
  └─ handleVerifyOtp() → setTimeout(800ms) → auto-succeeds
  └─ Client sets step → 'profile'

Step 3: Profile Completion
  └─ User enters: name, student ID, password
  └─ authService.register({ email, name, password })
  └─ Calls POST /api/v1/auth/register

Step 4: Server Registration
  └─ auth.validator.ts validates body (email, password ≥6, name ≥2)
  └─ auth.service.ts checks if email exists via user.service
  └─ user.service.ts creates user in Supabase (NO password stored!)
  └─ auth.service.ts signs JWT with { userId, email, role }
  └─ Returns { token, user, expiresAt }

Step 5: Client Session
  └─ authService stores token + user in localStorage
  └─ authStore.setSession() updates Zustand state
  └─ Navigate to /app (student dashboard)
```

### Target Flow (What It SHOULD Be):

```
Step 1: Email Entry (same as current)

Step 2: OTP Verification
  └─ Server sends real OTP via Supabase Auth email OR skip for hackathon demo
  └─ For hackathon: accept any 6-digit code (current behavior is fine)

Step 3: Profile Completion (same as current)

Step 4: Server Registration (FIXED)
  └─ auth.service.ts hashes password with bcrypt before storing
  └─ user.service.ts stores password_hash in users table
  └─ Signs JWT and returns session

Step 5: Client Session (same as current)
```

---

## 4. Sign In Workflow

### Current Flow:

```
Step 1: Role Tab Selection
  └─ Student tab → prefills email to student@campus.edu
  └─ Admin tab   → prefills email to admin@campus.edu

Step 2: Credential Entry
  └─ Email + password form
  └─ Client-side: validates *.edu domain

Step 3: Login Execution
  └─ authService.login({ email, password })
  └─ CLIENT SHORTCUT: if email is admin@campus.edu or student@campus.edu
     → returns hardcoded demo session WITHOUT hitting server
  └─ Otherwise: calls POST /api/v1/auth/login

Step 4: Server Login
  └─ auth.service.ts finds user by email via user.service
  └─ NO PASSWORD CHECK AT ALL — if user exists, login succeeds
  └─ Signs JWT and returns session

Step 5: Client Session
  └─ Stores token + user in localStorage
  └─ Navigates to /admin (ADMIN role) or /app (USER role)
```

### Target Flow:

```
Step 1-2: Same as current

Step 3: Login Execution (FIXED)
  └─ authService.login() ALWAYS calls the server (remove hardcoded shortcuts)
  └─ Keep fallback only for network errors during demo

Step 4: Server Login (FIXED)
  └─ auth.service.ts finds user by email
  └─ Compares provided password against stored password_hash using bcrypt
  └─ Rejects with 401 if password doesn't match
  └─ Signs JWT and returns session

Step 5: Same + RoleGuard actually enforces auth
```

---

## 5. Forgot Password Workflow

### Current Flow (Fully Simulated):

```
Step 1: Email Entry → client transitions to OTP step
Step 2: OTP → setTimeout auto-succeeds → transitions to reset step
Step 3: New password form → setTimeout → toast "Password updated!" → navigate /login
NO SERVER INTERACTION AT ALL
```

### Target Flow:

For the hackathon, the forgot password can remain a **client-side simulation** since:
- There's no real email sending configured
- Supabase Auth password reset requires email confirmation
- The demo users use known passwords

> **Decision: Keep forgot password as-is for hackathon. Document it as a "UI demo".**

---

## 6. Identified Issues & Gaps

### 🔴 CRITICAL (Must Fix for Auth to Work)

| #  | Issue                                  | File(s)                                    | Fix Required |
| -- | -------------------------------------- | ------------------------------------------ | ------------ |
| C1 | No `users` table in DB schema          | `server/src/db/schema.sql`                 | Add CREATE TABLE users |
| C2 | No password hashing in registration    | `server/src/services/auth.service.ts`      | Add bcrypt hash before user creation |
| C3 | No password verification in login      | `server/src/services/auth.service.ts`      | Add bcrypt.compare() |
| C4 | User service doesn't save password     | `server/src/services/user.service.ts`      | Add password_hash column to insert |
| C5 | No demo users in seed script           | `server/src/db/seed.ts`                    | Seed admin + student users with hashed passwords |
| C6 | RoleGuard always passes                | `client/src/components/layout/RoleGuard.tsx`| Enforce authentication check |
| C7 | SmartRedirect → /admin when unauthenticated | `client/src/components/layout/RoleGuard.tsx` | Redirect to /login |

### 🟡 IMPORTANT (Should Fix)

| #  | Issue                                  | File(s)                                    | Fix Required |
| -- | -------------------------------------- | ------------------------------------------ | ------------ |
| I1 | Client hardcodes demo login bypass     | `client/src/services/authService.ts`       | Remove hardcoded sessions, use server |
| I2 | Client has heavy fallback simulation   | `client/src/services/authService.ts`       | Reduce fallback scope |
| I3 | 401 response interceptor should trigger logout | `client/src/services/api.ts`        | Call authStore.logout() on 401 |
| I4 | No user model password_hash field      | `server/src/models/user.model.ts`          | Add to UserDbRow |

### 🟢 NICE TO HAVE (Post-Hackathon)

| #  | Issue                               | Notes |
| -- | ----------------------------------- | ----- |
| N1 | Real email OTP via Supabase Auth    | Requires Supabase email config |
| N2 | Google OAuth real integration       | Requires Supabase Google provider |
| N3 | Password reset backend endpoint     | POST /api/v1/auth/forgot + /reset |
| N4 | Session refresh / token rotation    | refreshToken field exists in types |

---

## 7. Task Checklist

### Phase 1: Database — `users` Table

- [x] ~~**T1.1** Add `users` table to `server/src/db/schema.sql`~~
- [x] ~~**T1.2** Run the new schema in Supabase SQL Editor / database~~
- [x] ~~**T1.3** Verify table structure and constraints (unique email, role check, status check)~~

---

### Phase 2: Password Hashing — Server

- [x] ~~**T2.1** Install bcrypt: `cd server && npm install bcryptjs && npm install -D @types/bcryptjs`~~
- [x] ~~**T2.2** Update `server/src/services/user.service.ts` and `user.model.ts`~~
  - ~~Add `password_hash` to the INSERT statement in `createUser()`~~
  - ~~Add `getUserByEmailWithPassword()` method that returns the hash~~
  - ~~Update `UserDbRow` in `server/src/models/user.model.ts` to include `password_hash`~~
- [x] ~~**T2.3** Update `server/src/services/auth.service.ts`~~
  - ~~**Register**: Hash password with `bcrypt.hash(password, 12)` before calling `createUser()`~~
  - ~~**Login**: Use `getUserByEmailWithPassword()` then `bcrypt.compare(password, hash)`~~
  - ~~Reject with `ApiError.unauthorized()` if password doesn't match~~

---

### Phase 3: Seed Demo Users

- [x] ~~**T3.1** Update `server/src/db/seed.ts` to seed demo users: `admin@campus.edu` / `admin123` (ADMIN) and `student@campus.edu` / `student123` (USER)~~
- [x] ~~**T3.2** Run seed: `npm run seed` in server workspace~~
- [x] ~~**T3.3** Verify seeded users and login capabilities~~

---

### Phase 4: Client Auth Service Cleanup

- [x] ~~**T4.1** Update `client/src/services/authService.ts` to remove hardcoded demo shortcuts and always call backend `/auth/login` and `/auth/register`~~
- [x] ~~**T4.2** Update `client/src/services/api.ts` to clear `auth_token` and `auth_user` on 401 Unauthorized responses~~

---

### Phase 5: RoleGuard & Navigation Fixes

- [x] ~~**T5.1** Fix `client/src/components/layout/RoleGuard.tsx` to enforce authentication and role access~~
- [x] ~~**T5.2** Fix `SmartRedirect` to redirect unauthenticated visitors to `/login`~~
- [x] ~~**T5.3** Test role-based protection (Student vs Admin vs Unauthenticated)~~

---

### Phase 6: End-to-End Verification

- [x] ~~**T6.1** Start dev servers (`npm run dev`)~~
- [x] ~~**T6.2** Test Sign Up flow end-to-end: `/signup` → OTP → Profile → Real backend registration → Redirect to `/app`~~
- [x] ~~**T6.3** Test Sign In flow with correct credentials and rejection on invalid passwords~~
- [x] ~~**T6.4** Test auth protection on `/admin` and `/app` routes~~
- [x] ~~**T6.5** Test One-Tap demo buttons for Student and Admin~~
- [x] ~~**T6.6** Test Logout flow from both Student navbar and Admin sidebar~~

---

## 8. File Reference Map

### Files That Need Changes:

```
server/
├── src/
│   ├── db/
│   │   ├── schema.sql              ← ADD users table (T1.1)
│   │   └── seed.ts                 ← ADD demo user seeding (T3.1)
│   ├── models/
│   │   └── user.model.ts           ← ADD password_hash to UserDbRow (T2.2)
│   ├── services/
│   │   ├── auth.service.ts         ← ADD bcrypt hash/compare (T2.3)
│   │   └── user.service.ts         ← ADD password_hash to insert (T2.2)
│   └── package.json                ← ADD bcryptjs dependency (T2.1)

client/
├── src/
│   ├── services/
│   │   ├── authService.ts          ← REMOVE demo bypasses (T4.1)
│   │   └── api.ts                  ← ADD 401 → logout (T4.2)
│   └── components/
│       └── layout/
│           └── RoleGuard.tsx       ← FIX auth enforcement (T5.1, T5.2)
```

### Files That Are Complete (No Changes Needed):

```
shared/src/types/auth.types.ts       ✅ LoginPayload, RegisterPayload, AuthSession, DecodedToken
server/src/validators/auth.validator.ts ✅ Zod schemas for login + register
server/src/routes/v1/auth.routes.ts  ✅ POST /login, POST /register, GET /me
server/src/controllers/auth.controller.ts ✅ login, register, getMe handlers
server/src/middlewares/auth.middleware.ts ✅ authenticate + authorize
client/src/store/authStore.ts        ✅ Zustand state + localStorage sync
client/src/hooks/useAuth.ts          ✅ Convenience hook over authStore
client/src/pages/auth/LoginPage.tsx  ✅ Full UI with role tabs + demo buttons
client/src/pages/auth/SignupPage.tsx  ✅ 3-step UI (email → OTP → profile)
client/src/pages/auth/ForgotPage.tsx ✅ UI demo (no backend needed for hackathon)
client/src/components/auth/OtpFlow.tsx ✅ 6-digit OTP input with paste support
client/src/routes/AppRoutes.tsx      ✅ All route definitions
```

---

## Summary

**Total tasks to make auth fully functional: 17 items across 6 phases.**

The critical path is:
1. Create `users` table → 2. Add password hashing → 3. Seed demo users → 4. Fix client service → 5. Enable RoleGuard → 6. Verify E2E

**Estimated time: ~45-60 minutes for a senior developer.**

# CampusOS — Developer Task & Folder Responsibility Guide

This document outlines **what responsibilities belong to which folder and file** across the full-stack codebase. Use this guide to understand where to place code, how to add new features, and how responsibilities are separated.

---

## 🗂️ High-Level Directory Overview

| Directory | Responsibility | Primary Stack |
|-----------|----------------|---------------|
| `shared/` | Single source of truth for cross-stack Types & Constants | TypeScript |
| `server/` | Express.js API backend (Controllers, Services, Routes, Middlewares) | Node.js / Express / Zod / Supabase |
| `client/` | React 18 frontend with modular feature components & state | React / Vite / Zustand / CSS |
| `tests/`  | Automated unit and integration test suites | Vitest |

---

## 📁 Detailed Folder & File Responsibility Matrix

### 1. `shared/` — Cross-Stack Contracts

> **Rule:** Never duplicate type definitions or HTTP constants between `client` and `server`. Place them here.

| Path | File | What goes here / Task to perform |
|------|------|----------------------------------|
| `shared/src/types/` | `user.types.ts` | Entity interfaces (`User`), Enums (`UserRole`, `UserStatus`), Create/Update DTOs. |
| `shared/src/types/` | `auth.types.ts` | Login/Registration payloads, `AuthSession`, and decoded JWT token interfaces. |
| `shared/src/types/` | `api.types.ts` | Standardized API response format (`ApiResponse<T>`), pagination structures. |
| `shared/src/constants/` | `httpStatus.ts` | Centralized HTTP status code constants (`HttpStatus.OK`, `HttpStatus.BAD_REQUEST`). |
| `shared/src/constants/` | `roles.ts` | Role definitions (`ADMIN`, `USER`) and granular permission strings. |
| `shared/src/constants/` | `routes.ts` | API route paths shared by client HTTP requests and server routing. |
| `shared/src/` | `index.ts` | Main index file exporting all shared types and constants for `@shared` imports. |

---

### 2. `server/` — Backend Architecture

> **Rule:** Controllers must NEVER query Supabase directly. Always route through `Service` methods.

#### ⚙️ Configuration & Utils (`server/src/config/`, `server/src/utils/`)

| File | Responsibility & Tasks |
|------|------------------------|
| `server/src/config/index.ts` | Environment variable loader using `Zod` and `dotenv`. Validates `PORT`, `JWT_SECRET`, `SUPABASE_URL`, and keys on startup. |
| `server/src/config/supabase.ts` | Initializes the admin Supabase client using `SUPABASE_SERVICE_ROLE_KEY`. |
| `server/src/utils/apiResponse.ts` | Defines `ApiError` class (with factory methods like `badRequest`, `unauthorized`, `notFound`) and `sendResponse` helper. |
| `server/src/utils/logger.ts` | Structured logging helper (`info`, `warn`, `error`, `debug`). |
| `server/src/utils/asyncHandler.ts` | Higher-order wrapper to catch async exceptions in controllers and pass them to error middleware. |

#### 🛡️ Middlewares & Validators (`server/src/middlewares/`, `server/src/validators/`)

| File | Responsibility & Tasks |
|------|------------------------|
| `server/src/middlewares/auth.middleware.ts` | `authenticate`: Verifies JWT Bearer tokens and attaches `req.user`. <br> `authorize`: Role-based access control guard. |
| `server/src/middlewares/validate.middleware.ts` | `validateRequest`: Express middleware executing Zod schemas against `req.body`. |
| `server/src/middlewares/error.middleware.ts` | `errorHandler`: Global Express error handler formatting `ApiError` and uncaught errors. |
| `server/src/validators/user.validator.ts` | Zod schema validation rules for user creation and update requests. |
| `server/src/validators/auth.validator.ts` | Zod schema validation rules for login and registration payloads. |

#### 📦 Services, Controllers & Routes (`server/src/services/`, `server/src/controllers/`, `server/src/routes/`)

| File | Responsibility & Tasks |
|------|------------------------|
| `server/src/models/user.model.ts` | Database row mapping functions (`mapUserRowToEntity`) transforming raw DB rows to `User` entities. |
| `server/src/services/user.service.ts` | **Business Logic Layer**: Queries Supabase table `users` or handles memory fallback operations for user CRUD. |
| `server/src/services/auth.service.ts` | Handles password checks, user authentication, and issues signed JWT tokens. |
| `server/src/controllers/user.controller.ts` | Handles user request/response flow. Invokes `UserService` and returns `sendResponse`. |
| `server/src/controllers/auth.controller.ts` | Handles login/registration request flow. Invokes `AuthService`. |
| `server/src/controllers/health.controller.ts` | Health check endpoint returning uptime and server status. |
| `server/src/routes/v1/user.routes.ts` | Express router mounting `/api/v1/users` endpoints with validation and auth guards. |
| `server/src/routes/v1/auth.routes.ts` | Express router mounting `/api/v1/auth` endpoints (`/login`, `/register`, `/me`). |
| `server/src/routes/v1/index.ts` | Combines all V1 feature routers under `/api/v1`. |
| `server/src/routes/index.ts` | Main router mounting `/v1` routes. |
| `server/src/app.ts` | Express application setup: configures Cors, Helmet, Morgan, JSON parsing, routes, 404 handler, and error middleware. |
| `server/server.ts` | Server entry point listening on `PORT` with graceful shutdown handlers. |

---

### 3. `client/` — Modular Frontend Architecture

> **Rule:** Group feature-specific UI and logic in `client/src/features/<feature_name>/` rather than scattering components.

#### 🌐 Services, Store & Hooks (`client/src/services/`, `client/src/store/`, `client/src/hooks/`)

| File | Responsibility & Tasks |
|------|------------------------|
| `client/src/config/env.config.ts` | Accesses Vite environment variables (`import.meta.env`). |
| `client/src/services/api.ts` | Centralized `Axios` client configured with base URL, timeout, and Bearer token request interceptors. |
| `client/src/services/supabaseClient.ts` | Browser Supabase client initialized with `VITE_SUPABASE_ANON_KEY`. |
| `client/src/services/userService.ts` | API service functions making HTTP calls to backend `/users` endpoints. |
| `client/src/services/authService.ts` | API service functions making HTTP calls to `/auth` endpoints and managing `localStorage` tokens. |
| `client/src/store/authStore.ts` | `Zustand` store holding `user`, `token`, `isAuthenticated` state, login/logout, and profile fetching. |
| `client/src/hooks/useAuth.ts` | Custom React hook exposing auth state, user role getters, and session methods. |
| `client/src/hooks/useFetch.ts` | Generic React data-fetching hook managing `data`, `loading`, `error`, and `refetch()`. |

#### 🎨 Components, Features & Pages (`client/src/components/`, `client/src/features/`, `client/src/pages/`)

| Path | Component / File | What goes here |
|------|------------------|----------------|
| `components/common/` | `Button.tsx`, `Input.tsx`, `Card.tsx`, `Modal.tsx` | Atomic, reusable UI primitives styling buttons, input fields, glassmorphic cards, and overlay modals. |
| `components/layout/` | `Navbar.tsx`, `Sidebar.tsx`, `Footer.tsx`, `AppLayout.tsx` | Persistent layout framing headers, navigation links, sidebar drawers, and footer. |
| `features/auth/` | `LoginForm.tsx`, `RegisterForm.tsx` | Self-contained forms handling user login and registration flows. |
| `features/dashboard/` | `DashboardOverview.tsx` | Dashboard metric cards (total users, system status, quick stats). |
| `features/user/` | `UserList.tsx`, `UserProfileCard.tsx` | User directory grid and user profile presentation cards. |
| `pages/` | `Home.tsx` | Landing page showcasing features and call-to-actions. |
| `pages/` | `Login.tsx` | Authentication page embedding `LoginForm` / `RegisterForm`. |
| `pages/` | `Dashboard.tsx` | Protected dashboard view incorporating `DashboardOverview`, `UserList`, and user creation modals. |
| `routes/` | `AppRoutes.tsx` | React Router route definitions and `ProtectedRoute` authentication guards. |
| `src/` | `App.tsx`, `main.tsx`, `index.css` | React entry point, global layout wrapper, and glassmorphic CSS design tokens. |

---

## 🛠️ Step-by-Step Workflow: How to Add a New Feature

Follow this checklist whenever you add a new system or feature (e.g., `Events` or `Announcements`):

```
┌────────────────────────────────────────────────────────┐
│ 1. Define Types & Constants in `shared/`               │
│    └─ Add entity interface & DTOs in shared/src/types/ │
├────────────────────────────────────────────────────────┤
│ 2. Backend Implementation (`server/`)                  │
│    ├─ Create Zod validator in server/src/validators/  │
│    ├─ Create Service in server/src/services/          │
│    ├─ Create Controller in server/src/controllers/    │
│    └─ Mount Routes under server/src/routes/v1/         │
├────────────────────────────────────────────────────────┤
│ 3. Frontend Implementation (`client/`)                 │
│    ├─ Create API client function in client/services/   │
│    ├─ Build Feature Components in client/features/    │
│    ├─ Add Page in client/pages/                        │
│    └─ Register Route in client/routes/AppRoutes.tsx    │
├────────────────────────────────────────────────────────┤
│ 4. Write Unit Tests in `tests/`                        │
│    └─ Add service test in tests/server/               │
└────────────────────────────────────────────────────────┘
```

---

## 🧪 Developer Commands Summary

| Command | Action |
|---------|--------|
| `npm run dev` | Runs both backend API (`:5000`) and frontend Vite dev server (`:5173`) concurrently. |
| `npm run build` | Builds TypeScript code for `shared`, `server`, and packages `client` via Vite. |
| `npm run test` | Runs the Vitest test suite across server services and validators. |

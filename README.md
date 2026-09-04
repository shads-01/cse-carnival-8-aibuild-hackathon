# CampusOS — Scalable Modular Full-Stack Architecture

A production-ready, feature-driven, full-stack monorepo designed for high scalability, maintainability, and clean separation of concerns.

- **Frontend**: TypeScript, React 18, Vite, Zustand, Glassmorphic Design System
- **Backend**: Node.js, Express.js, TypeScript (Layered Controller-Service-Config architecture), Zod validation
- **Database & Auth**: Supabase (`@supabase/supabase-js`) with service-role backend isolation and client browser wrapper
- **Shared Module**: Cross-stack TypeScript declarations (`@shared/types`) and constants

---

## 📁 Recommended Project Structure

```
.
├── client/                         # Frontend (TypeScript + React + Vite)
│   ├── public/                     # Static public assets
│   ├── src/
│   │   ├── assets/                 # Images, icons, static styles
│   │   ├── components/             # Reusable UI components
│   │   │   ├── common/             # Button, Input, Card, Modal, Badge, Spinner
│   │   │   └── layout/             # Navbar, Sidebar, Footer, AppLayout
│   │   ├── features/               # Feature-based modular logic
│   │   │   ├── auth/               # LoginForm, RegisterForm
│   │   │   ├── dashboard/          # DashboardOverview
│   │   │   └── user/               # UserProfileCard, UserList
│   │   ├── pages/                  # Route-level page components
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── services/               # API & Supabase interactions
│   │   │   ├── api.ts              # Axios wrapper with interceptors
│   │   │   ├── supabaseClient.ts   # Browser Supabase client
│   │   │   ├── userService.ts      # User API calls
│   │   │   └── authService.ts      # Auth API & Supabase integration
│   │   ├── hooks/                  # Custom React hooks (useAuth, useFetch)
│   │   ├── store/                  # State management (Zustand authStore)
│   │   ├── types/                  # Client-specific UI state types
│   │   ├── utils/                  # Client helper functions
│   │   ├── config/                 # Typed environment configurations
│   │   ├── routes/                 # React Router & protected route guards
│   │   ├── App.tsx                 # Main application component
│   │   ├── main.tsx                # Client entry point
│   │   └── index.css               # Design tokens & glassmorphic styles
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                         # Backend (Express.js + TypeScript)
│   ├── src/
│   │   ├── config/                 # Environment, DB, & app configurations
│   │   │   ├── index.ts            # Type-safe env validation with Zod
│   │   │   └── supabase.ts         # Supabase service role client setup
│   │   ├── controllers/            # HTTP Request handlers
│   │   │   ├── user.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── health.controller.ts
│   │   ├── services/               # Business logic & DB access layer
│   │   │   ├── user.service.ts
│   │   │   └── auth.service.ts
│   │   ├── routes/                 # API routes & endpoint definitions
│   │   │   ├── v1/                 # API version 1 routers
│   │   │   │   ├── user.routes.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts            # Main route mounting
│   │   ├── middlewares/            # Auth, Zod validation, error handling
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── validate.middleware.ts
│   │   ├── validators/             # Zod request payload schemas
│   │   │   ├── user.validator.ts
│   │   │   └── auth.validator.ts
│   │   ├── models/                 # DB model definitions & row mappers
│   │   │   └── user.model.ts
│   │   ├── utils/                  # Logger, response formatters, async handlers
│   │   │   ├── logger.ts
│   │   │   ├── apiResponse.ts
│   │   │   └── asyncHandler.ts
│   │   ├── types/                  # Backend declaration extensions (req.user)
│   │   └── app.ts                  # Express application setup
│   ├── server.ts                   # Server initialization entry point
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                         # Cross-stack shared workspace
│   ├── src/
│   │   ├── types/                  # User, Auth, & API response types
│   │   │   ├── user.types.ts
│   │   │   ├── auth.types.ts
│   │   │   └── api.types.ts
│   │   ├── constants/              # HTTP Status codes, Roles, API Routes
│   │   │   ├── httpStatus.ts
│   │   │   ├── roles.ts
│   │   │   └── routes.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── tests/                          # Automated tests
│   └── server/
│       └── user.service.test.ts
│
├── .env                            # Active environment file
├── .env.example                    # Environment template
├── package.json                    # Workspace root package config
├── tsconfig.base.json              # Shared TypeScript base configuration
└── README.md                       # Architecture & documentation guide
```

---

## 🔑 Key Design Decisions

### 1. Feature-Based Frontend (`client/src/features/`)
Instead of grouping files strictly by type (e.g., placing all forms or hooks in generic folders), logic is encapsulated inside feature domain modules (`auth`, `dashboard`, `user`).
- **Encapsulation**: Components, hooks, and services related to a specific domain live together.
- **Scalability**: New features can be created independently without cluttering top-level directories.

### 2. Layered Backend Architecture (`Controller → Service → Config`)
- **Controller Layer (`controllers/`)**: Responsible *only* for handling incoming HTTP requests, extracting path/body parameters, invoking services, and returning formatted `ApiResponse` payloads.
- **Service Layer (`services/`)**: Encoders of business logic and database queries (interacting with Supabase or DB models). Controllers never make direct database calls.
- **Validator Layer (`validators/`)**: Uses `Zod` schemas passed to `validateRequest` middleware to validate request bodies before hitting controllers.
- **Config Layer (`config/`)**: Centralized type-safe environment loading and Supabase client initialization.

### 3. Supabase Isolation
- **Client Supabase Client (`client/src/services/supabaseClient.ts`)**: Pre-configured browser client for public or real-time subscriptions.
- **Server Supabase Client (`server/src/config/supabase.ts`)**: Uses the `SUPABASE_SERVICE_ROLE_KEY` with administrative access isolated strictly on the server.

### 4. Shared Monorepo Package (`shared/`)
Located at `./shared`, this workspace exposes `@shared/types` and `@shared/constants`.
- Ensures 100% type safety across frontend and backend for DTOs, API responses, and User roles.
- Prevents interface duplication and out-of-sync type definitions.

---

## ⚙️ Naming Conventions

- `*.controller.ts`: Express HTTP request/response handler
- `*.service.ts`: Business logic & data provider layer
- `*.routes.ts`: Express endpoint definitions
- `*.model.ts`: Data structure interface & DB row mapper
- `*.middleware.ts`: Express middleware (Auth guard, validation, error handler)
- `*.validator.ts`: Zod schema definitions

---

## 🚀 Microservices & Future Migration Readiness

The decoupled structure makes future microservices migration seamless:
1. **Service Decoupling**: Each service in `server/src/services/` operates independently. Extracting a domain (e.g., `user.service.ts` or `auth.service.ts`) into a standalone microservice requires zero refactoring of business logic.
2. **API Versioning**: Endpoint routes are mounted under `/api/v1/`, making contract upgrades or version migrations backwards-compatible.
3. **Shared Contract**: The `@shared/types` package can be published to a private NPM registry or shared as a git submodule across multiple microservices.

---

## 🛠️ Quick Start & Running Commands

### 1. Environment Setup
Copy `.env.example` to `.env` and update credentials:
```bash
cp .env.example .env
```

### 2. Install Dependencies
Install all workspace dependencies from the root directory:
```bash
npm install
```

### 3. Build All Workspace Packages
```bash
npm run build
```

### 4. Development Mode (Runs Client & Server Concurrently)
```bash
npm run dev
```

- **Frontend Client**: Runs on `http://localhost:5173`
- **Backend API**: Runs on `http://localhost:5000` (Health check: `http://localhost:5000/api/v1/health`)

### 5. Running Automated Tests
```bash
npm run test
```

---

## 📝 API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/health` | Health check endpoint | No |
| `POST` | `/api/v1/auth/register` | Register new user account | No |
| `POST` | `/api/v1/auth/login` | Authenticate user & return JWT token | No |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/v1/users` | List all users | Yes |
| `GET` | `/api/v1/users/:id` | Get user details by ID | Yes |
| `POST` | `/api/v1/users` | Create user (Admin) | Yes (Admin) |
| `PUT` | `/api/v1/users/:id` | Update user (Admin) | Yes (Admin) |
| `DELETE` | `/api/v1/users/:id` | Delete user (Admin) | Yes (Admin) |

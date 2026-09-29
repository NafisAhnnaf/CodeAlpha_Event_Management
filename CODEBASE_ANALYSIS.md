# Codebase Audit & System Analysis: Event Management System

**Project:** CodeAlpha Event Management System  
**Analyzed Repositories:** `server/` (Bun/Node.js, Express 5, Drizzle ORM, PostgreSQL) & `client/` (React 19, Vite 8, TypeScript)  
**Date:** September 2026  

---

## 1. Executive Summary

A comprehensive line-by-line review of the codebase was conducted. The project has laid out foundational building blocks (database schema migrations on Neon Postgres, Argon2 hashing, Jose JWT, and Express 5 routing). However, several **critical blockers, security vulnerabilities, and empty stubs** exist that currently prevent normal operation, alongside database design gaps that need addressing before implementing full event workflows.

---

## 2. High-Severity & Critical Bugs

### 🚨 Critical Vulnerability: Authentication Bypass on Login
* **Location:** [`server/src/controllers/user.controller.ts`](./server/src/controllers/user.controller.ts) (lines 23-28)
* **Issue:** Missing `await` keyword on `verify(password, user.password)`.
  ```typescript
  // Current Code
  const hasMatched = verify(password, user.password); // verify() is async!
  if (!hasMatched) {
    return res.status(400).json({ message: "Invalid password" });
  }
  ```
* **Impact:** In JavaScript, `verify(...)` returns an unawaited `Promise<boolean>`. A `Promise` object is always truthy in a boolean evaluation, meaning `!hasMatched` will **always evaluate to `false`**. Any wrong password entered for an existing email will be accepted, granting unauthorized JWT tokens and access.
* **Fix:** Add `await`: `const hasMatched = await verify(password, user.password);`.

---

### 🚨 Critical Bug: Double Response / `ERR_HTTP_HEADERS_SENT` in Auth Middlewares
* **Location:** [`server/src/middlewares/auth.middleware.ts`](./server/src/middlewares/auth.middleware.ts) (lines 24-29, 63-71, 104-111)
* **Issue:** In all three middlewares (`userAuth`, `adminAuth`, and `organizerAuth`), after verifying the token and calling `next()`, code execution drops straight through to send an error response:
  ```typescript
  // In userAuth:
  if (user) {
    req.user = user;
    next(); // <--- passes control to next handler
  }
  return res.status(401).json({ message: "Invalid user, please login" }); // <--- ALWAYS EXECUTES!
  ```
* **Impact:** For every authenticated request, Express calls the downstream controller AND immediately attempts to send a `401 Unauthorized` or `403 Forbidden` response. This crashes the request with `Cannot set headers after they are sent to the client`.
* **Fix:** Change to `return next();`.

---

### 🚨 TypeScript Build Failure: Missing Express Request Type Extension
* **Location:** [`server/src/middlewares/auth.middleware.ts`](./server/src/middlewares/auth.middleware.ts) (lines 24, 63, 104)
* **Issue:** Property `user` is not declared on Express `Request`. Running `tsc --noEmit` fails with TS2339:
  ```
  src/middlewares/auth.middleware.ts:24:15 - error TS2339: Property 'user' does not exist on type 'Request'.
  ```
* **Fix:** Create a custom types definition file (e.g. `src/types/express.d.ts`):
  ```typescript
  import type { users } from "../db/schema.ts";
  declare global {
    namespace Express {
      interface Request {
        user?: typeof users.$inferSelect;
      }
    }
  }
  ```

---

### 🚨 Inconsistent `req.user` Assignment
* **Location:** [`server/src/middlewares/auth.middleware.ts`](./server/src/middlewares/auth.middleware.ts) (line 104)
* **Issue:** `userAuth` and `adminAuth` attach the full database row `user` to `req.user`, whereas `organizerAuth` attaches `payload` (`{ user_id, role }`).
* **Impact:** Downstream routes expecting `req.user.name` or `req.user.email` will crash when accessed via `organizerAuth`.

---

### 🚨 Broken Server Build Configuration
* **Location:** [`server/package.json`](./server/package.json) vs [`server/tsconfig.json`](./server/tsconfig.json)
* **Issue:** `package.json` specifies `"build": "tsc"` and `"start": "node dist/index.js"`. However, `tsconfig.json` has `"noEmit": true`.
* **Impact:** Running `bun run build` generates 0 output files in `dist/`. Consequently, `bun run start` fails with `Cannot find module dist/index.js`. Furthermore, `"peerDependencies": { "typescript": "^7" }` in `package.json` references a non-existent TypeScript version.

---

## 3. Database Schema & Data Integrity Flaws

### 1. Typo in Postgres Enum
* **Location:** [`server/src/db/schema.ts`](./server/src/db/schema.ts) (line 23)
* **Issue:** Enum is declared as `pgEnum("plaforms", ["online", "onsite"])` (missing 't' in `"plaforms"`).
* **Fix:** Rename to `"platforms"` and generate a Drizzle migration.

### 2. Disconnected Event Ownership (`events` table)
* **Location:** [`server/src/db/schema.ts`](./server/src/db/schema.ts) (lines 25-36)
* **Issue:** The `events` table does NOT have an `organizer_id` or `creator_id` foreign key referencing `users.id`.
* **Impact:** There is no way to know who created or manages an event, nor can organizers view or edit their own events.

### 3. Missing Event Attributes
* **Capacity / Seat Limit:** No `capacity` or `max_seats` column.
* **Pricing & Currency:** Has `isPaid: boolean()`, but lacks `price`, `currency`, or `ticket_price`.
* **Media:** No `banner_url` or `image_url` for event branding.
* **Online vs Onsite Details:** No dedicated fields for meeting link (online) vs physical venue address (onsite).

### 4. Registration Table Lacks Uniqueness & Constraints
* **Location:** [`server/src/db/schema.ts`](./server/src/db/schema.ts) (lines 45-51)
* **Issue:** 
  1. `user_id` and `event_id` are nullable (missing `.notNull()`).
  2. There is no composite unique constraint on `(user_id, event_id)`.
* **Impact:** A single user can register hundreds of times for the same event, causing spam and seat allocation distortion.
* **Fix:** Add `.notNull()` and `unique("user_event_unique").on(table.user_id, table.event_id)`.

### 5. Payments Table Incomplete
* **Location:** [`server/src/db/schema.ts`](./server/src/db/schema.ts) (lines 58-64)
* **Issue:** 
  1. `reg_id` is nullable.
  2. No `amount` column.
  3. No `currency` column.
  4. No `status` enum (`pending`, `completed`, `failed`, `refunded`).
  5. `trx_id` lacks a unique constraint.

---

## 4. Security & Architecture Review

| Area | Current State | Risk | Recommendation |
|---|---|---|---|
| **Credential Logging** | `console.log(req.body)` in `user.controller.ts` & `console.log(token)` in `auth.middleware.ts` | High: Passwords & JWT tokens printed in plain text to console logs | Remove all sensitive payload logs immediately |
| **User Enumeration** | `Invalid email` vs `Invalid password` error messages | Medium: Attackers can check if an email exists | Return generic message: `Invalid email or password` |
| **Health Check Route** | `app.get("/health", adminAuth, ...)` | Medium: Health check requires Admin JWT | Make `/health` public for monitoring and orchestrators |
| **Environment Variable Loading** | `dotenv.config()` called after ES imports in `index.ts`; `jwt.ts` lacks dotenv import | Medium: Potential undefined env values during module evaluation | Import `"dotenv/config"` at the very top or pass `--env-file` |
| **Rate Limiting** | `redis` dependency installed, but `rate-limi.middleware.ts` is 0 bytes | High: Login endpoint vulnerable to brute force | Implement Redis-based or memory rate limiting |
| **API Versioning & Routing** | `app.use(userRouter)` mounted at `/` without `/api` prefix | Low: Namespace pollution | Prefix with `/api/v1/auth`, `/api/v1/events`, etc. |

---

## 5. Unimplemented / Empty Files (0 Bytes)

The following files exist in the repository but have 0 bytes of code:
1. [`server/src/controllers/event.controller.ts`](./server/src/controllers/event.controller.ts)
2. [`server/src/routes/event.routes.ts`](./server/src/routes/event.routes.ts)
3. [`server/src/middlewares/error.middleware.ts`](./server/src/middlewares/error.middleware.ts)
4. [`server/src/middlewares/logger.middleware.ts`](./server/src/middlewares/logger.middleware.ts)
5. [`server/src/middlewares/rate-limi.middleware.ts`](./server/src/middlewares/rate-limi.middleware.ts) *(Typo in filename: `rate-limi`)*

---

## 6. Client (Frontend) Status

The frontend is currently the default Vite 8 + React 19 template:
* **UI/Pages:** Only `App.tsx` counter demo.
* **Routing:** No router configured (`react-router` / `@tanstack/react-router`).
* **Styling:** Default CSS; no Tailwind CSS, CSS modules, or UI component library.
* **State & Networking:** No API client (Axios / Fetch wrapper), no React Query / SWR, no Auth Context or store.

---

## 7. Next Steps & Ready for Your Plan

Once you provide the overall plan and requirements, the logical progression will be:
1. **Patch Core Server Bugs**: Fix the login authentication bypass, the auth middleware response bug, Express typing, and sensitive logging.
2. **Refine Schema & Migrations**: Add `organizer_id`, event pricing/capacity, unique registration constraints, and payment status.
3. **Implement Core Controllers & Routes**: Complete user signup, profile, event CRUD, event search/filter, and registration workflows.
4. **Setup Global Middlewares**: Implement error handling, request logging, and rate limiting.
5. **Frontend Architecture**: Setup routing, authentication state, UI framework/styling, and event browsing/management views.

# Antigravity Agent Rules — Milk Diary Project

These are **strict, non-negotiable rules** for any AI coding agent (Antigravity) working on this codebase. Read this file before making any change. If a rule conflicts with a user instruction, ask for confirmation before proceeding — do not silently override a rule.

## 1. Source of Truth
- `requirement.md`, `description.md`, `folder-structure.md`, and `phases.md` are the source of truth for scope. Do not add features not listed in these files without explicit user approval.
- Do not skip ahead to a later phase (see `phases.md`) before the current phase's acceptance criteria are met.

## 2. Project Structure
- Never restructure folders without updating `folder-structure.md` in the same change.
- Backend (`/server`) and Frontend (`/client`) remain fully separate apps with their own `package.json`, `.env`, and dependencies. No cross-imports between them.
- All new backend logic goes in the correct layer: `routes/` → `controllers/` → `services/` → `models/`. Business logic never lives inside route files.

## 3. Environment & Secrets
- Never hardcode secrets, API keys, VAPID keys, DB URIs, or JWT secrets in source files. Always read from `.env` via `process.env`.
- Always update `.env.example` when a new env variable is introduced — never commit real `.env` files.
- Never print secrets to console/logs.

## 4. Database Rules
- All schema changes go through Mongoose models in `models/`. No raw/ad-hoc collections created from route handlers.
- Never perform destructive operations (`drop`, `deleteMany` without filter, migrations that lose data) without explicit confirmation from the user.
- Every write to `milkEntries` must be idempotent per `(customerId, month, day)` — never create duplicate day entries; always upsert.
- Soft-delete customers (`status: "inactive"`) — never hard-delete a customer that has billing history.

## 5. API Rules
- Every endpoint must validate input (Zod/Joi) before touching the DB.
- Every endpoint must return consistent JSON shape: `{ success, data, error }`.
- Admin-only routes must be behind admin JWT middleware; customer routes behind customer JWT middleware. Never mix the two.
- No endpoint may return another customer's data to a logged-in customer (strict ownership check on every customer-facing query).

## 6. Realtime (Socket.IO) Rules
- Every socket event must have a corresponding REST fallback — the app must not fully depend on sockets for correctness (offline-safe writes).
- Socket handlers must re-validate auth (JWT) on connection; never trust `customerId` sent from the client without matching it to the authenticated session (except admin actions, which explicitly target a customerId).
- Room naming convention is fixed: `customer:<id>` and `admin`. Do not invent new room patterns without updating this file.

## 7. Push Notifications
- VAPID keys generated once, stored in `.env`, never regenerated casually (it invalidates all existing subscriptions).
- Always handle push send failures gracefully (expired subscription → remove from DB, don't crash the request).
- Never send push notifications for anything outside the scope defined in `requirement.md` (no marketing/spam use).

## 8. Frontend Rules
- Mobile-first, responsive by default — the Quick Add tab is primarily used on a phone.
- No blocking full-page reloads for quick-add actions; must feel instant (optimistic UI + socket ack/rollback).
- Reuse the same "monthly card" component for both Admin's customer profile view and the Customer's own overview page — do not build two divergent implementations.
- No inline styles for anything beyond one-off dynamic values; use Tailwind utility classes consistently.

## 9. Code Quality
- TypeScript is preferred if the user agrees; otherwise consistent JSDoc types in plain JS.
- No commented-out dead code left in commits.
- Every new feature ships with at least a basic manual test note in the PR/commit description (formal test suite added per `phases.md`).
- Keep functions small and single-purpose; no God-controllers.

## 10. Git / Change Discipline
- One logical change per commit; descriptive commit messages (`feat:`, `fix:`, `chore:`, `refactor:`).
- Never force-push over shared history without explicit instruction.
- Do not delete or rewrite files outside the current task's scope.

## 11. When Uncertain
- If a requirement is ambiguous, make the smallest reasonable assumption, state it clearly in the response, and proceed — do not block on it unless it risks data loss or security.
- Never silently drop a requested feature because it seems hard; flag complexity and propose a phased approach instead.

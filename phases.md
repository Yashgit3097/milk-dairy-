# Development Phases — Milk Diary

Each phase should be fully working and testable before moving to the next. Do not start a phase until the previous phase's acceptance criteria pass.

---

## Phase 0 — Project Setup
- Init `client` (Vite + React + Tailwind) and `server` (Express) as described in `folder-structure.md`.
- Setup MongoDB Atlas cluster + connection.
- Setup `.env.example` for both apps.
- Base Express app with `helmet`, `cors`, `express.json`, error handler middleware.
- Base React app with routing skeleton (Admin routes vs Customer routes).
- **Acceptance**: server responds on `/health`, client renders a blank shell, DB connects successfully.

## Phase 1 — Admin Auth + Customer CRUD
- Admin model + login (JWT).
- Customer model + CRUD APIs (create auto-generates unique `activationCode`).
- Admin frontend: login page, Customers tab (list, create, edit, deactivate, search/filter by area/status).
- **Acceptance**: Admin can log in, add/edit/deactivate a customer, and see the list update correctly.

## Phase 2 — Monthly Card Data Model + Customer Profile
- `MilkEntry` model (`customerId + month + days{}`).
- API to fetch a customer's monthly cards.
- Build the shared `MonthlyCard` component (day grid 1–31, `-` for empty).
- Customer Profile page in admin shows list of monthly cards.
- **Acceptance**: Opening a customer's profile shows correctly rendered cards for existing/seed data.

## Phase 3 — Quick Add + Realtime (Socket.IO)
- Area-wise grouped/sorted customer list on Quick Add tab.
- Quick-tap buttons (250ml/500ml/1L/custom) with optimistic UI update.
- Socket.IO server: `milk:add` event → upsert into `MilkEntry.days[today]` → idempotent.
- REST fallback endpoint for the same action (offline-safe).
- Admin dashboard live-updates on new entries (via `admin` room).
- **Acceptance**: Tapping a quantity instantly reflects in that customer's card and in the Overview tab totals, without page reload; duplicate taps don't create duplicate day-entries.

## Phase 4 — Admin Overview Dashboard
- Aggregation APIs: today's totals, month totals, area-wise breakdown, active/inactive counts, pending-today list.
- Dashboard UI with summary cards + recent activity feed.
- **Acceptance**: Numbers match the sum of actual `MilkEntry` data; updates live as Quick Add actions happen.

## Phase 5 — Customer Portal (Activation + Overview)
- Activation flow: enter `activationCode` + mobile → verify → issue customer JWT → mark `isActivated: true`.
- Customer Overview page reusing `MonthlyCard` (read-only) + current month total liters & amount due.
- Customer-side Socket.IO room (`customer:<id>`) for live updates when admin adds milk.
- **Acceptance**: A newly created customer can activate with their code, see an empty current-month card, and watch it update live when admin quick-adds milk for them.

## Phase 6 — Web Push Notifications
- Generate VAPID keys, wire `web-push` on server.
- Service worker + push subscription flow on customer frontend (permission prompt after activation).
- Store `pushSubscription` on `Customer` document.
- On `milk:add`, server sends a push notification in parallel with the socket emit.
- Handle expired/invalid subscriptions gracefully.
- **Acceptance**: With the customer tab closed, tapping a quantity for them in Quick Add triggers an OS-level push notification.

## Phase 7 — Billing
- `pricePerLiter` global setting + optional per-customer override, with effective-date versioning.
- Billing API: given customer + month, compute day-wise breakdown, total liters, total ₹.
- Billing summary API: all customers for a given month (name, total ml, total ₹).
- Minimal, print/export-friendly Billing UI for admin.
- **Acceptance**: Bill totals match manually-verified sums; changing price only affects entries after its effective date (past bills stay correct).

## Phase 8 — Polish, Security Hardening, Testing
- Input validation everywhere (Zod/Joi), rate limiting on activation & login endpoints.
- Mobile responsiveness pass, especially Quick Add tab.
- Basic automated tests: entry idempotency, activation flow, billing calculation.
- Loading/error states across the UI; empty states (e.g., new customer with no entries yet).
- **Acceptance**: App usable end-to-end on a phone in the field; no duplicate/lost entries under rapid tapping; no unauthenticated access to another customer's data.

## Phase 9 — Deployment
- Deploy `server` (Render/Railway) with env vars set, MongoDB Atlas connected.
- Deploy `client` (Vercel/Netlify) pointing to production API + socket URL.
- Configure HTTPS (required for Web Push + Service Worker).
- Smoke test full flow in production: create customer → activate → quick add → push notification → billing.
- **Acceptance**: Full user journey works in production exactly as it did locally.

# Requirements Document — Milk Diary

## 1. Tech Stack (Recommended)

| Layer | Technology |
|---|---|
| Frontend (Admin + Customer) | React (Vite) + TailwindCSS + React Query |
| State/Realtime client | Socket.IO client |
| Backend | Node.js + Express.js |
| Realtime server | Socket.IO server |
| Database | MongoDB (Mongoose ODM) |
| Auth (Admin) | JWT (email + password), bcrypt for hashing |
| Auth (Customer) | Activation-code exchange → JWT (long-lived, stored in localStorage/cookie) |
| Push Notifications | Web Push API (`web-push` npm) + VAPID keys + Service Worker |
| Hosting suggestion | Backend: Render/Railway; DB: MongoDB Atlas; Frontend: Vercel/Netlify |
| Optional PWA | Vite PWA plugin for installable customer app + push support |

**Why this stack fits:** Socket.IO gives you the "tap → instant reflect on customer dashboard" behavior out of the box. Web Push + Service Worker gives native-like notifications without a native app. MongoDB's flexible schema is a natural fit for the "one document per customer per month, with 31 day-fields" pattern.

---

## 2. Data Model (MongoDB Collections)

### `admins`
```
_id, name, email, passwordHash, role ("owner"), createdAt
```

### `customers`
```
_id, name, mobile, area, activationCode (unique, indexed),
isActivated (bool), status ("active" | "inactive"),
pricePerLiter (number, can override global price),
pushSubscription (object | null),
createdAt, updatedAt
```

### `milkPrices` (global default, versioned)
```
_id, pricePerLiter, effectiveFrom, createdAt
```

### `milkEntries` (one doc per customer per month — “the card”)
```
_id, customerId (ref), month (e.g. "2026-04"),
days: { "1": 250, "2": 0, "3": 500, ..., "31": null }  // ml per day, null = no entry
totalMl (derived/cached), totalAmount (derived/cached),
createdAt, updatedAt
```
> Storing one document per customer per month (instead of one doc per entry) makes the "card" UI a single read, and matches the exact UX described (a card per month, days 1–31, `-` for empty).

### `notifications` (optional log)
```
_id, customerId, type ("milk_added"), payload, sentAt, status
```

---

## 3. Functional Requirements

### 3.1 Admin — Tab 1: Overview / Dashboard
- Today's total milk collected (liters) & today's active customer count.
- Current month total liters & total revenue (₹).
- Area-wise breakdown (mini chart or list).
- Recent activity feed (last N quick-add actions).
- Quick stats: total customers, active vs inactive, pending (no entry today).

### 3.2 Admin — Tab 2: Customers (CRUD)
- **Create**: name, mobile number (unique validation optional), area, price/liter (optional override) → system auto-generates a unique `activationCode`.
- **Read**: searchable/filterable list (by name, mobile, area, status).
- **Update**: edit details, deactivate/reactivate, regenerate activation code.
- **Delete**: soft delete preferred (status = inactive) to preserve billing history.
- **Customer Profile Page**:
  - Shows monthly cards, most recent first (e.g. `Apr-2026`, `Mar-2026`, ...).
  - Each card: grid of days 1–31 (adapts to month length) with liters; `-` where no entry.
  - Month total liters + total ₹ shown on the card header.

### 3.3 Admin — Tab 3: Quick Add
- Customer list grouped by **area**, sorted alphabetically (or by delivery route order).
- Each customer row has quick-tap buttons: `250ml`, `500ml`, `1L`, and a `+custom` input.
- Tap → emits a Socket.IO event → server persists to today's date in that customer's monthly doc.
- UI updates instantly (optimistic + server ack) without page reload.
- Triggers a Web Push notification to the customer ("Your milk (250ml) has been added today").
- Support "undo last entry" for mis-taps.
- Visual indicator on who's already been marked today vs pending.

### 3.4 Billing (Admin)
- Select customer + month → generate bill: day-wise table, total liters, total ₹ (based on price/liter).
- Clean/minimal print-friendly or PDF-exportable layout.
- Optional: bulk "billing summary" for all customers in a month (name, total ml, total ₹).

### 3.5 Customer Portal
- **Page 1 — Activation**: enter activation code (+ mobile no. for verification) → account activated → JWT issued → redirected to overview.
- **Page 2 — Overview**:
  - Current month card (same day-grid UI as admin sees, read-only).
  - Total liters this month + total amount due (price × liters).
  - Push notification opt-in prompt (browser permission) on first login.
- Real-time: when admin quick-adds milk, customer's open dashboard updates live via Socket.IO (if online) and/or receives a Web Push if the tab is closed.

### 3.6 Real-time & Notifications
- Socket.IO rooms: one room per customer (`customer:<id>`) and one admin room (`admin`) for dashboard-wide updates.
- Web Push: subscription stored on activation (with permission), sent via `web-push` server library using VAPID keys.

---

## 4. Non-Functional Requirements
- **Security**: bcrypt-hashed admin passwords, JWT with expiry + refresh strategy, activation codes are single-use to activate (but persist as identifier), rate-limit activation attempts, input validation (Joi/Zod) on every endpoint, helmet + CORS locked to known origins.
- **Performance**: indexed queries on `customerId+month`, pagination on customer list, debounce quick-add double taps.
- **Reliability**: idempotent quick-add (avoid duplicate entries from double socket emit), fallback REST endpoint if socket disconnects.
- **Scalability**: stateless Express instances behind a load balancer + Socket.IO Redis adapter if scaling beyond one node.
- **Usability**: mobile-first responsive UI (admin quick-add is used on-the-go), minimal taps to record milk.
- **Auditability**: keep an entry-level change log (who/when) for disputes.

---

## 5. API Surface (high level)

```
POST   /api/admin/login
POST   /api/customers                # create + generate activation code
GET    /api/customers                # list (filters: area, status, search)
GET    /api/customers/:id
PUT    /api/customers/:id
DELETE /api/customers/:id
GET    /api/customers/:id/entries    # all monthly cards
GET    /api/customers/:id/entries/:month

POST   /api/customer/activate        # { activationCode, mobile } -> JWT
GET    /api/customer/me/overview     # current month card + amount

POST   /api/entries/quick-add        # { customerId, ml, date? } (also mirrored via socket)
DELETE /api/entries/:id/undo

GET    /api/billing/:customerId/:month
GET    /api/billing/summary/:month

POST   /api/push/subscribe
```

## 6. WebSocket Events
```
client -> server : "milk:add"        { customerId, ml }
server -> admin   : "milk:added"     { customerId, date, ml, monthTotals }
server -> customer: "milk:added"     { date, ml, monthTotals }
server -> admin   : "dashboard:update" (periodic or on-change)
```

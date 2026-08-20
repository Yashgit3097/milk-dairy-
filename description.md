# Milk Diary — Project Description

## What is this?
A MERN-stack web application that lets a milk vendor (Admin/Owner) manage daily doorstep milk delivery for their customers digitally — replacing the paper diary. The admin records how much milk was delivered to each customer every day with one tap, and the customer can log in with a one-time activation code to see their own monthly consumption and bill in real time.

## Who uses it?

### 1. Admin (Owner)
Single vendor/owner account (can be extended to multiple staff later). Manages customers, records daily deliveries, views dashboards, and generates monthly bills.

### 2. Customer
End consumer who receives milk daily. Gets a unique activation code from the admin (printed/shared once), uses it to activate their account, and then views their own consumption history and bill — no password to remember beyond first-time activation.

## Core Idea
- Admin has a **3-tab panel**: Overview, Customers, Quick Add.
- Every customer has a **monthly "card"** (e.g. `Apr-2026`) showing day-by-day liters delivered (`1` to `31`), with `-` for days nothing was delivered.
- **Quick Add tab**: customers grouped/sorted by area, each with quick-tap quantity buttons (250ml / 500ml / 1L / custom). Tapping instantly writes today's entry via **WebSocket** (real-time, no page reload) and pushes a **Web Push notification** to that customer's device.
- Customer app has **2 pages**: Activation (one-time) and Overview (current month liters + amount as per price set by admin).
- **Billing**: admin can pick any customer + month and get a clean, minimal bill — day-wise milk, total liters, total ₹.

## Key Differentiators
- Real-time sync (WebSocket) between admin action and customer's dashboard.
- Instant Web Push notification the moment milk is recorded — no app install needed (PWA-based).
- Activation-code-based customer onboarding — zero-friction login for non-technical users.
- Minimal, calendar-style monthly card UI that mirrors how vendors already think about a "month" of delivery.

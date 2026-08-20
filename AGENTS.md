# AGENTS.md — Milk Diary (Central Agent Instructions)

> This file is auto-read by Antigravity at the start of every session. It is the single entry point — do not duplicate this content elsewhere; update this file if rules change.

## 0. Read Order (do this first, every session)
Before writing any code, read in this order:
1. `@/description.md` — what the product is
2. `@/requirement.md` — exact functional/non-functional scope, data model, API surface
3. `@/folder-structure.md` — where every file goes
4. `@/phases.md` — what to build now vs. later
5. `@/rules.md` — hard constraints (security, idempotency, env, git discipline)

Do not skip this. Do not rely on memory from a previous session — re-read these five files every time you start work, because context resets between sessions.

## 1. Current State (update this section as you progress)
```
CURRENT_PHASE: Phase 9 — Deployment
LAST_COMPLETED_PHASE: Phase 8 — Polish, Security Hardening, Testing
NEXT_ACCEPTANCE_CRITERIA: see phases.md > Phase 9 > Acceptance
```
> **Agent instruction:** at the end of every task, update `CURRENT_PHASE` and `LAST_COMPLETED_PHASE` in this section so the next session knows exactly where to resume. Never guess the phase — check this block first.

## 2. Non-Negotiable Constraints (summary — full detail in rules.md)
- No feature outside `requirement.md` without explicit user approval.
- No skipping ahead of `CURRENT_PHASE` in `phases.md`.
- No secrets hardcoded — `.env` only, and update `.env.example` on every new var.
- All `milkEntries` writes are idempotent upserts on `(customerId, month, day)` — never duplicate.
- Soft-delete customers only (`status: "inactive"`), never hard-delete.
- Every socket event needs a REST fallback.
- Reuse one shared `MonthlyCard` component for both admin and customer views — never fork it.
- Strict ownership checks: a customer's endpoint can never return another customer's data.

## 3. Folder Structure
Follow `@/folder-structure.md` exactly. If a new file doesn't have an obvious home there, stop and ask rather than inventing a new top-level folder.

## 4. Workflow — How to Build Each Feature
For every new feature request from the user, follow this loop:
1. **Locate it** in `phases.md` — confirm it belongs to `CURRENT_PHASE` (or ask if it seems to belong to a later phase).
2. **Check requirement.md** for the exact spec (fields, API shape, socket events) — don't invent shapes.
3. **Plan** — produce a short implementation plan/task list before coding (Antigravity's Artifact stage). Wait for approval if the plan touches auth, data model, or billing.
4. **Build** — respecting `folder-structure.md` layering (`routes → controllers → services → models`) and `rules.md`.
5. **Verify** against the phase's "Acceptance" criteria in `phases.md`.
6. **Update Section 1** of this file (current phase / next steps).

## 5. Escalation Rule
If a request conflicts with `rules.md`, `requirement.md`, or the current phase boundary, do not silently comply and do not silently refuse — state the conflict plainly and ask for a decision.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Browser/UI verification is OPT-IN, not automatic

Never launch a browser, Chromium, Playwright, Puppeteer, or screenshot-based UI verification on your own.

For frontend tasks, implement the requested changes and perform only code-level validation. Do not independently decide that visual verification is necessary.

Only perform browser-based testing when I explicitly instruct you to do so.

If you believe browser verification is necessary, do not do it automatically. Simply tell me:
"Browser verification is available if you want me to perform it."

Then stop.

## What this repo is

Internal admin/setup platform ("Outlet Admin") for configuring restaurants and hospitals ("organizations"), their outlets/branches, tables, staff, and department contact routing. It reads and writes against a Postgres database that is **shared with a much larger production product** (patient feedback, conversations, escalations, QR-based patient/staff logins, etc.) — `prisma/schema.prisma` has 60+ models, but this app only touches a small subset: `users`, `restaurants`, `outlet`, `outlet_department`, `department_config`, `user_department_subscription`, `table_group`, `table`, `staffs`, `qr_login`. Treat unrelated models in the schema as belonging to other services; don't assume this app is the only writer.

## Commands

```bash
pnpm dev          # start dev server (Next.js, Turbopack)
pnpm build        # prisma generate && next build
pnpm start         # start production server
pnpm lint         # eslint .
```

There is no test suite/framework configured in this repo (no `test` script, no Jest/Vitest/Playwright config).

Prisma:
```bash
npx prisma generate            # regenerate client after schema.prisma changes
npx prisma migrate dev --name <name>   # create + apply a migration in dev
```
`prisma generate` also runs automatically via the `postinstall` script and at the start of `pnpm build`.

One-off admin/data-fix scripts live in `scripts/` and are run directly against the DB, outside the Next.js request context:
```bash
node --env-file=.env scripts/<script>.mjs
```
These scripts intentionally take no CLI args — they use hardcoded `const` values at the top of the file that must be edited before running. Do not run them yourself unless explicitly asked to; the pattern in this repo has been for the user to fill in the constants and run them.

## Architecture

**Stack**: Next.js 16 (App Router, React 19), Prisma 7 with the `@prisma/adapter-pg` driver adapter (see `lib/prisma.ts` — a single shared `PrismaClient` instance, not per-request), Tailwind v4 + shadcn/ui (`components/ui/*`, "new-york" style, configured in `components.json`), `react-hook-form` + `zod` for forms.

**Route groups**: `app/(auth)` (login) and `app/(dashboard)` (everything else, wrapped in `app/(dashboard)/layout.tsx` with a fixed `Sidebar` + sticky `Header`). The dashboard layout's scroll container must stay height-constrained (`h-svh` + `overflow-y-auto`) for any `position: sticky` element inside it to actually work — CSS makes any `overflow: auto` ancestor the sticky containing block regardless of whether it currently overflows, so removing that height constraint silently breaks all sticky elements in the tree (this has happened before).

**Auth model**: single shared admin password (`ADMIN_PASSWORD` env var), not per-user accounts. `lib/actions/auth.ts` checks the password and calls `lib/auth/session.ts` to set a base64-JSON `admin_session` cookie (7-day expiry). `middleware.ts` gates every non-public, non-API, non-static route on that cookie. This is unrelated to the `users` Prisma model, which represents outlet/department contacts and consumer-app users, not admin-panel operators.

**Data layer**: no repository/service layer — Prisma is called directly from `'use server'` action files in `lib/actions/*.ts` (one file per resource: `organizations.ts`, `outlets.ts`, `departments.ts`, `users.ts`, `tables.ts`, `table-groups.ts`, `staffs.ts`, plus `bulk-upload-*.ts` for CSV/bulk import flows). Server components call these actions or `prisma` directly for reads (e.g. `app/(dashboard)/outlets/[id]/page.tsx` → `getOutlet()` in `lib/actions/outlets.ts`); client components call them as server actions from event handlers, typically wrapped in `useTransition`.

**Frontend data-shape types**: `types/index.ts` hand-written interfaces (e.g. `OutletWithRelations`, `DepartmentConfig`, `User`) mirror the exact Prisma `include`/`select` shape returned by the corresponding `lib/actions/*.ts` query. There's no shared generic or `Prisma.XGetPayload<...>` linking them — when you change an `include`/`select` in an action, you must manually update the matching type in `types/index.ts`, or the two silently drift.

**Outlet workspace**: `components/outlet-workspace/outlet-workspace.tsx` is the tabbed hub for a single outlet (Overview, General, Table Groups, Tables, Users, Department Mapping, OPD Details, Passwords, QR Logins — the last two of these three are hidden for `RESTAURANT`-type organizations). Active tab is persisted per-outlet in `sessionStorage` (not the URL) so a refresh keeps the same tab without polluting the address bar. Each tab is its own component in `components/outlet-workspace/`.

**Department mapping / roles**: `department_config` rows are the "contact" entries (TO/CC, email, WhatsApp numbers) attached to an `outlet_department`. They're linked to a `users` row via `user_id` (FK) — always populate `user_id` when creating/updating a `department_config` row, matching by email alone is legacy behavior and unreliable across outlets. Three `UserRole` values are mappable to departments today: `DEPARTMENT`, `GRE_HEAD`, `SERVICE_EXCELLENCE`. The Department Mapping tab's role filter reads each config's role via the `department_config -> users -> role` join (`lib/actions/outlets.ts`'s `getOutlet`), not by cross-referencing the outlet's user list by email — the latter breaks when a mapped user's `outlet_id` doesn't match the outlet being viewed.

**QR login proxy**: `app/api/qr-logins/*` are thin proxy routes — the browser only ever talks to this app's own origin (authenticated by the `admin_session` cookie via `requireAdminSession()`), and `lib/qr-backend.ts` forwards the request server-side to an external app backend (`QR_BACKEND_URL`) with an internal API key (`QR_INTERNAL_API_KEY`) attached. The key never reaches the browser. Client code calls these routes through `lib/qr-login-client.ts`. See `QR_LOGIN_BACKEND_SPEC.md` and `QR_LOGIN_WEBAPP_GUIDE.md` at the repo root for the fuller spec of this integration.

**Env vars** (`.env`, not committed): `DATABASE_URL`, `DIRECT_DATABASE_URL`, `ADMIN_PASSWORD`, `QR_BACKEND_URL`, `QR_INTERNAL_API_KEY`.

**Postgres sequence gotcha**: this DB has periodically been restored/seeded with explicit IDs without advancing the corresponding autoincrement sequences, causing `P2002` unique-constraint errors on `.create()` calls for otherwise-empty-looking tables. If you hit this, compare `MAX(id)` against the sequence's `last_value`/`is_called` (via `pg_get_serial_sequence('"table"','id')`) before assuming it's a code bug — it's very likely a sequence desync, fixable with a `setval()` bump, not a schema/logic issue. Always confirm with the user before writing directly to the shared DB.

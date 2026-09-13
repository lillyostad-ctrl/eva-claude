# EvalCore MVP architecture

The application has one execution path: `src/main.tsx` → `src/mvp/App.tsx`.

## Live layers

- `connectors.ts` is the source boundary. The included HRIS, task, ERP, DMS, and payroll adapters run in transparent mock mode and normalize source events into the canonical UWES contract.
- `mockData.json` is the seeded organization: fifty people across eight teams in four departments with a four-level management hierarchy, work items, canonical events and an evidence ledger. Regenerate it with `scripts/generate_org_data.py`.
- `engine.ts` owns the canonical domain, responsibility graph, event stream, exception and attribution records, sampling cases, period lifecycle, scoring, confidence, approval rules, and the manager hierarchy (`directReports`/`allReports`, walking each person's `managerId`).
- `access.ts` builds the list of role/context switches from the seeded organization itself: one scoped context per team manager and per manager-of-managers (a manager whose own reports are themselves managers), plus the fixed functional contexts (Reviewer, Calibrator, Governance, Payroll, Model admin, …). `scopeFor(db, context)` resolves what a context can see — a manager's own reports (recursively, for a manager of managers), the single demo employee, or the whole organization for org-wide functional contexts.
- `repository.ts` is the replaceable persistence boundary. This static deployment uses browser storage under a versioned demo schema. A production implementation must replace this adapter with authenticated server persistence.
- `App.tsx`, `RolePages.tsx`, `Workspace.tsx`, `Controls.tsx`, and `Analytics.tsx` are the only UI implementation.

## Security boundary

The role and context selector represents separate demo identities — including one per real team manager and manager-of-managers in the seeded organization — so every workflow and every level of the hierarchy can be exercised without accounts. Authorization checks still run at each mutation boundary, including independent review, ordered approval, governance-only lifecycle transitions, and locked-period rejection. It is not production authentication. A server repository must derive the actor, the manager's real reporting scope, and capabilities from an authenticated session and ignore client-supplied roles.

## Production connector contract

Real adapters must emit the same canonical event fields: stable event ID, event type, category, UTC occurrence time, actor ID, responsibility role, and work-item ID. Source payloads remain outside scoring. Payroll is outbound only and receives results after review, calibration, governance approval, and hold checks.

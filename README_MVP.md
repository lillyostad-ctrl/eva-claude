# EvalCore MVP

An English, working evidence-to-decision workspace built from the supplied React/Vite prototype and the technical product overview. The original prototype files remain in `src/` for comparison; the active application is `src/mvp/`, imported by `src/main.tsx`.

## Run

Use Node.js 24 or newer. Run `npm install`, then `npm run dev`. The local URL is `http://localhost:3000`. Build with `npm run build`; type-check with `npm run lint`. Run domain tests with `node --experimental-strip-types --test src/mvp/engine.test.ts`.

## Working features

| Workspace | What works |
| --- | --- |
| Overview | Calculated cycle statistics, absolute-band distribution, attention queue, searchable people, team and period filters |
| My impact | Own score, five dimensions, confidence trace, evidence lineage, historical score inputs, appeal submission |
| People / manager | Team evaluations, full assessment drilldown, evidence submission, workload links |
| Projects | Outcomes, contribution records, owner shares, source references, verification progress |
| Evidence | Add provisional records, locked complexity factors, duplicate source-reference rejection, review, correction history, CSV download |
| Quality review | Pending/returned and critical queue, qualified rubric entry, verify or return, context exclusion |
| Calibration | Separate review, calibration, and approval identities; reason required at each step |
| Appeals | Submit, view, adjudicate; open appeals block approval; explicit resolutions preserved |
| Performance pay | Export only eligible approved results to a clearly labeled shadow-payroll CSV |
| Model & policy | Exact six archetype weights, 70/30 hybrids, versioned role mapping, visible formulas |
| People analytics | Evidence health, external delay exclusions, role/level/opportunity context; no unsupported small-sample fairness claims |
| Audit trail | Searchable action history, before/after evidence snapshots, JSON export |

## Demo walkthrough

The seeded organization is fifty people across eight teams in four
departments, with a four-level management hierarchy (executive → department
head → team manager → individual contributor). The context switcher in the
header lists a scoped "Management" context for every team manager and every
manager-of-managers, built from the actual seeded reporting lines — not a
single fixed demo team.

1. Start in August 2026. Open the **شخصی — اثرگذاری من** (self) context and review one person's evaluation.
2. Switch to a team manager's **مدیریت — تیم …** context: it shows only that manager's own direct reports. Switch to a department head's **مدیریت — واحد …** context: it recursively rolls up every team manager and individual contributor under them — a manager of managers.
3. Switch the top-right demo role to **Reviewer**, open a person, enter a rationale and confirm review.
4. Switch to **Calibrator**, reopen the same evaluation, provide the independent calibration reason and confirm.
5. Switch to **Governance**, reopen the result and approve it with a rationale.
6. Switch to **Payroll**, open Performance pay, and export the approved CSV.
7. Open **System quality** or **Data & controls** to find a work item with a critical exception: its calculated score stays visible but approval is held until Governance adjudicates it with a reason.
8. Open **Appeals** as Governance: an open appeal blocks payroll export until it is resolved with an evidence-based decision.
9. Switch to Employee and submit an appeal, or to a Manager context and add evidence. All old approvals become historical until reviewed again.
10. Reload the browser: locally saved changes remain. September starts with no contribution evidence and shows not-ratable results until qualified evidence exists.

## App structure

```text
src/main.tsx              Application entry
src/mvp/App.tsx           Shell, navigation, context switching, filters, save/audit coordination
src/mvp/access.ts         Builds one scoped context per manager (and manager-of-managers) from the org
src/mvp/RolePages.tsx     Read-oriented pages scoped to the active context
src/mvp/Workspace.tsx     Evidence, review, appeal, model, payroll and detail workflows
src/mvp/Analytics.tsx     Derived team and cohort views
src/mvp/engine.ts         Typed entities, org seed, manager-hierarchy helpers, deterministic score and approval rules
src/mvp/repository.ts     Replaceable local database boundary
src/mvp/engine.test.ts    Scoring, hierarchy and governance invariants
src/mvp/style.css        Workspace design tokens, layout and responsive shell
src/mvp/workspace.css    Forms, dialogs and workflow layouts
```

The persistence boundary is intentionally small. Replace `loadDatabase` / `persistDatabase` with a versioned API when adding a backend; keep scoring and state-transition rules on the server. For a larger implementation, split Workspace into evidence, reviews, appeals, models and payroll feature modules, each owning its commands and UI. Avoid independent copies of score state in each screen: all views derive from one database snapshot.

Recommended production storage: organizations; people and effective employment assignments; period snapshots; immutable standard versions; work items; responsibility shares; source events; qualified assessments; context exclusions; appeals; approval decisions; payroll batches; audit events. Evidence ingestion should use source idempotency keys, immutable source hashes and correction events. Keep identity, source normalization, scoring, governance, reporting and payroll adapters as separate service boundaries within a modular monolith before considering microservices.

## Rules and explicit MVP choices

- All six archetype weights, performance bands, hybrid blending, complexity units and rolling weights follow the overview.
- An accepted contribution is a unique work record. Raw event volume, comments, presence and protected attributes never earn points.
- Contribution = accepted complexity units × verified responsibility share / expected units, capped at 100. Quality, stewardship and collective contribution use qualified rubric scores averaged across verified work. These rubric-to-score mappings are explicit MVP assumptions; the overview does not supply full archetype-specific metric calibration.
- Confidence uses 40/30/20/10 weights. Demo choices: high ≥80, moderate ≥50, three qualified artifacts for full sample adequacy, three sources for full diversity. Coverage uses accepted expected units. Production needs opportunity-aware coverage denominators and governed sample selection.
- August uses seeded July and June assessments. September uses the actual calculated August period score and the seeded July score. No verified work or unavailable required dimensions produces a not-ratable result.
- Critical exceptions hold approval without zeroing scores. Low confidence and not-ratable results never create adverse payouts. Uncontrollable delays are excluded from reliability.
- Approval order is Reviewer → Calibrator → Governance, each with a distinct simulated actor. A result must have no hold to advance or export.
- Changes increment one global database revision, conservatively invalidating **all** existing approvals while preserving historical decisions. A production implementation should invalidate only affected people, periods and downstream rolling results.
- Monetary configuration is intentionally limited to a documented demo factor: 1.20 for exceeds standard and a protected 1.00 otherwise. The CSV says SHADOW and is not an instruction to execute payment.

## Mock database and boundaries

Fifty synthetic people, spanning a four-level management hierarchy across
eight teams in four departments, and roughly ninety work items with an
evidence ledger are initialized deterministically from `src/mvp/mockData.json`
(regenerate with `python3 scripts/generate_org_data.py`). State is saved in
this browser's `localStorage`; it is not shared across devices. CSV and JSON
exports download locally. Source references are synthetic and have no
external connector. No API keys are needed.

Demo role switching is a workflow simulator, **not authentication or a security boundary**. Browser storage is editable and its audit ledger is not cryptographically immutable. Do not use real employee or payroll data in this MVP. Production requires server-enforced organization/team authorization, independent identity assignment, durable transactional storage, signed/versioned evidence, controlled migrations, calibrated rubrics, real HRIS/source adapters, qualified sampling, retention policies and payroll reconciliation.

Quality review is a manual queue; random/risk sampling automation, AI artifact review, multi-person responsibility-graph reconciliation, protected-attribute aggregate fairness analysis and true enterprise connectors are deliberately outside this MVP. The app does not claim those systems are connected or working.

## Validation

11 domain tests cover exact weight totals, decimal bands, complexity boundaries, weighted and rolling scores, the four-level management hierarchy, responsibility graph completeness, sampling rules, typed exceptions and attribution, imported score profiles, independent approval sequence, and menu-to-page coverage.

TypeScript checking and the production build are run before delivery. Browser interaction testing was not requested; no claim of end-to-end browser verification is made.

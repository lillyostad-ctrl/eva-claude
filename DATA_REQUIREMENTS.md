# EvalCore complete data requirements

This catalog lists the data needed to replace every demo value and fully populate every current role menu and page. Stable IDs are required for all entities. Dates must be ISO 8601 UTC, percentages must be 0–100, and source records should include their source-system ID and source update timestamp.

## 1. Identity, access, and scope

Required for the role selector, scoped sidebar, profile, authorization, inbox, and audit actor.

| Entity | Required fields | Optional fields | Expected source |
|---|---|---|---|
| User | `user_id`, `employee_id`, `full_name`, `work_email`, `status` | avatar, locale, timezone | Identity provider + HRIS |
| Access context | `context_id`, `user_id`, `role_code`, `scope_type`, `scope_id`, `scope_label`, `capabilities[]` | valid-from/to, delegation reason | IAM/RBAC |
| Role | `role_code`, Persian label, allowed capabilities | description, approval limits | IAM policy |
| Delegation | delegator, delegate, scope, capabilities, start/end | reason, ticket | IAM/workflow |

## 2. Organization and people

Required for people, teams, job families, expectations, comparison groups, analytics, and payroll matching.

| Entity | Required fields | Optional fields | Expected source |
|---|---|---|---|
| Person | employee ID, full name, employment status, job-family ID, level ID, manager ID, hire date | preferred name, location, employment type | HRIS |
| Team membership | person ID, team ID, membership type, allocation %, start/end | cost center | HRIS |
| Team | team ID, Persian name, manager ID, parent unit ID | mission, cost center | HRIS |
| Job family | family ID, Persian name, description | discipline, career track | HRIS/model registry |
| Job level | level ID, Persian label, rank/order | level description | HRIS/model registry |
| Protected-attribute cohort | pseudonymous person key, attribute code, cohort value, effective date, lawful-use marker | consent/legal basis | Segregated authorized HR analytics source |

Protected attributes must remain outside individual scoring and manager views. They are only needed for aggregate disparity audits with minimum-group-size suppression.

## 3. Evaluation cycles and expectations

Required for home pages, period selector, expectations, lifecycle controls, readiness, and publication.

| Entity | Required fields | Optional fields | Expected source |
|---|---|---|---|
| Evaluation cycle | cycle ID, label, cadence, start/end, evidence cutoff, state | lock/publish timestamps, owner | Performance administration |
| Cycle eligibility | cycle ID, person ID, included/excluded, reason | proration | HRIS + cycle admin |
| Expectation | expectation ID, person/team/project scope, title, outcome definition, period, owner | target value, milestone, dependency | Goal/task system |
| Opportunity baseline | person ID, period, expected work units, available capacity | leave/absence adjustment, assignment mix | HRIS + task system |

Supported lifecycle states are Open, Calculating, Locked, and Published.

## 4. Performance model

Required for model pages, calculated evidence packages, scores, bands, and explainability.

| Entity | Required fields | Optional fields | Expected source |
|---|---|---|---|
| Model version | version ID, name, status, effective dates, author, approval | change note | Model registry |
| Archetype | archetype ID, Persian name, five dimension weights | work-pattern description | Model registry |
| Profile assignment | person/job-family ID, primary archetype, secondary archetype, blend %, effective date | exception approval | Model registry |
| Dimension rubric | dimension ID, Persian label, definition, evidence rules, score scale | examples by level | Model registry |
| Performance band | band ID, Persian label, minimum, maximum | guidance | Model registry |
| Confidence rule | component weights, thresholds, minimum evidence | source-diversity rules | Model registry |
| Rolling rule | current/previous/older period weights | missing-period treatment | Model registry |

## 5. Work items, responsibilities, and complexity

Required for contributions, team outcomes, project views, responsibility graph, attribution, and workload fairness.

| Entity | Required fields | Optional fields | Expected source |
|---|---|---|---|
| Work item | work-item ID, title/type, team/project ID, created/due/closed timestamps, status, intended outcome | parent/duplicate ID, priority | Task/case/ERP system |
| Role assignment | work-item ID, role code, person ID, allocation %, assigned-at | ended-at, assignment reason | Task system |
| Complexity assessment | work-item ID, scope, uncertainty, coordination, risk, total, band, work units, assessor | override reason/version | Task system + model engine |
| Project | project ID, Persian name, sponsor, lead, team, start/end, state | milestones, benefits | Project system |

Responsibility roles: requester, planner/prioritizer, assigner, decision owner, executor, contributor, and reviewer/approver.

## 6. Canonical UWES event stream

Required for event capture, engine replay, timelines, timeliness, blocking, responsibility-specific evidence, and the audit trail.

Every event requires: `event_id`, `event_type`, `category`, `occurred_at`, `recorded_at`, `actor_id`, `responsibility_role`, `work_item_id`, `source_system`, `source_record_id`, `schema_version`, and an integrity hash.

Useful event payload fields include previous/new state, reason code, deadline, blocker owner, dependency ID, artifact ID, decision ID, reviewer ID, and correlation/causation IDs.

Event types needed:

- Assigned, reassigned, started, submitted, accepted, returned, reopened, completed, cancelled.
- Blocked and unblocked, with blocker cause and accountable owner.
- Requirement changed, deadline changed, priority changed, capacity changed.
- Artifact linked, feedback recorded, decision requested, decision issued.
- Sample selected, sample reviewed, correction opened/resolved.
- Calibration proposed/accepted/rejected and result approved/published.

## 7. Evidence and feedback

Required for evidence lists, quality review, evidence gaps, calculated packages, confidence, and CSV export.

| Entity | Required fields | Optional fields | Expected source |
|---|---|---|---|
| Evidence record | evidence ID, work-item ID, person ID, responsibility role, source, source reference, period, status | excerpt/metadata | DMS/task/ERP/CRM |
| Artifact | artifact ID, URI/reference, version, created-at, owner, checksum | MIME type, classification | DMS/code/document system |
| Contribution share | evidence/work-item ID, person ID, role, share %, basis | approver | Task/project system |
| Feedback | feedback ID, subject, author, relationship, timestamp, dimension tags, text/rating | visibility, response | Feedback system |
| Verification | evidence ID, reviewer ID, outcome, reviewed-at, reason code | corrected values | Quality workflow |

## 8. Exceptions and causal attribution

Required for system-quality, attribution, governance holds, corrections, and defensible reliability scoring.

Each exception needs: exception ID, work-item/evidence ID, type, severity, detected-at, detector, description, status, owner, and supporting event IDs.

Exception types: incorrect, incomplete, procedural non-compliance, missing documentation, unclear/not fit for purpose, incorrect authorization, missed risk, missed deadline, and duplicate/unnecessary work. Store Minor, Major, or Critical where allowed.

Each attribution decision needs: attribution ID, affected metric/dimension, cause code, accountable role/person, excluded person IDs, allocation percentages for shared causes, evidence/event IDs, decision maker, rationale, decided-at, and revision.

Cause codes should cover employee delay, unanswered approval, requirement change after submission, unrealistic deadline, management-created overload, external outage/dependency, shared/multiple causes, and unknown/under review.

## 9. Sampling and quality control

Required for quality-home, sample queue, reviewer consistency, and anti-gaming controls.

| Entity | Required fields | Optional fields |
|---|---|---|
| Sampling policy | policy/version ID, method, population, rate, trigger rules, effective dates | random seed commitment |
| Sample case | sample ID, evidence/work-item IDs, selection method, reasons, selected-at, assigned reviewer, due-at, status | priority |
| Sample review | sample ID, reviewer, outcome, reason codes, reviewed-at | corrected values, notes |
| Reviewer validation | reviewer ID, period, sample size, agreement/error/return rates | benchmark cohort |
| Gaming signal | signal ID, type, subject/scope, severity, detected-at, inputs, status | investigation/case ID |

Signals needed include duplicate references, work splitting, abnormal easy-work selection, abnormal score distribution, repeated return/reopen patterns, reviewer inconsistency, missing source diversity, and sudden complexity overrides.

## 10. Assessments, decisions, and calibration

Required for person detail, manager draft review, calibration participant/facilitator, approval, and publication.

| Entity | Required fields | Optional fields |
|---|---|---|
| Period result | person, period, five dimension values, archetype/current/rolling scores, band, confidence, model version, revision | explanation snapshot |
| Decision | person, period, stage, actor, timestamp, written reason, revision, score snapshot | attachments |
| Calibration session | session ID, cohort definition, facilitator, participants, scheduled-at, state | agenda, meeting link |
| Calibration item | session/person, draft result, confidence, flags, proposed decision | peer-context summary |
| Calibration action | item, actor, action, reason, before/after, timestamp | follow-up owner |

Required stages: Draft, Reviewed, Calibrated, and Approved, with independent actors and ordered transitions.

## 11. Corrections, responses, and appeals

Required for employee responses, appeal reviewer, governance cases, holds, and historical revisions.

| Entity | Required fields | Optional fields |
|---|---|---|
| Correction case | case ID, record/result ID, requester, reason, opened-at, state | proposed correction |
| Appeal | appeal ID, person, period/result revision, grounds, evidence references, opened-at, status | requested remedy |
| Case assignment | case ID, independent reviewer, assigned-at, due-at | conflict check |
| Case decision | case ID, outcome, rationale, evidence considered, actor, decided-at | remediation |
| Employee response | result/case ID, employee ID, response text, timestamp | attachments |

## 12. Analytics and fairness

Required for people analytics, executive trends, opportunity analysis, disparity audits, and system-risk monitoring.

Store reproducible aggregate snapshots with period, cohort definition, numerator, denominator, metric value, model version, source freshness, and suppression state.

Metrics needed:

- Score, band, confidence, evidence coverage, accepted-work units, and complexity mix.
- Assignment opportunity, selection yield, easy/complex work share, blocked time, and excluded delay.
- Return/reopen, exception, correction, appeal, and overturn rates.
- Reviewer agreement and severity consistency.
- Team/manager patterns, source-system gaps, and model-version drift.
- Protected-cohort aggregate gaps in score, band, opportunity, confidence, sampling, correction, and appeal outcomes, with minimum-cell suppression.

## 13. Payroll handoff

Required for payroll preview and export.

| Entity | Required fields | Optional fields | Expected source |
|---|---|---|---|
| Pay eligibility | employee ID, period, eligible flag, plan ID | proration/exclusion reason | HRIS/payroll |
| Pay plan | plan ID/version, band/score mapping, effective date, currency | caps/floors | Compensation system |
| Export batch | batch ID, period, approved result revision IDs, created/approved by, timestamps, state | file checksum | EvalCore |
| Payroll receipt | batch ID, payroll system reference, received-at, outcome | rejected rows/reasons | Payroll |

Payroll must never receive draft scores, open appeals, critical exceptions, low-confidence holds, or unapproved revisions.

## 14. Connectors and data operations

Required for data-steward and administrator pages.

For every connector: connector ID/type, source name, mode, authentication reference, endpoint/tenant, enabled state, sync direction, schedule, owner, schema version, last attempted/successful sync, cursor/watermark, record counts, error counts, freshness SLA, health, and error summary.

Also required: field mapping versions, normalization failures, dead-letter records, retry history, replay jobs, reconciliation counts, and source-to-canonical lineage.

Secrets and tokens must be held in a secret manager and must never appear in this data package.

## 15. Audit, notifications, and administration

Required for the action inbox, audit view, access administration, and operational support.

| Entity | Required fields | Optional fields |
|---|---|---|
| Audit entry | event ID, timestamp, actor, action, target type/ID, before/after hashes, reason, correlation ID | IP/device under policy |
| Notification/action | action ID, recipient/context, type, target, created/due-at, priority, read/completed state | message |
| System setting | key, value, scope, version, changed-by/at | approval reference |
| Retention policy | record class, retention period, legal hold behavior | jurisdiction |
| Localization value | locale, key, translated text, version | reviewer |

## Minimum delivery files

The easiest import package is a set of UTF-8 JSON or CSV files named:

1. `users_and_access`
2. `people_teams_jobs`
3. `cycles_expectations`
4. `model_versions_profiles_rubrics`
5. `projects_work_items_roles_complexity`
6. `canonical_events`
7. `evidence_artifacts_feedback_verification`
8. `exceptions_attribution`
9. `sampling_quality_gaming`
10. `results_decisions_calibration`
11. `corrections_appeals_responses`
12. `aggregate_analytics_fairness`
13. `payroll_plans_eligibility_receipts`
14. `connectors_sync_lineage`
15. `audit_notifications_settings`

If a source cannot provide a required field, include the field with `null` and a companion `missing_reason`; do not fabricate values. A data dictionary should accompany the package with field type, allowed values, owner, source of truth, refresh cadence, sensitivity, and retention class.

#!/usr/bin/env python3
"""Generates src/mvp/mockData.json: a synthetic 50-person organization with a
four-level management hierarchy (executive -> department head -> team manager
-> individual contributor), eight teams across four departments, work items,
canonical events, exceptions/attribution, and an evidence ledger.

This data is fictional and generated only for UI/UX and QA purposes. Run with:
    python3 scripts/generate_org_data.py
"""
import hashlib
import json
import random
from datetime import datetime, timedelta

random.seed(42)

PERIODS = ["2026-06", "2026-07", "2026-08"]

MALE_FIRST = ["علی", "محمد", "حسین", "رضا", "امیر", "سعید", "بهروز", "کیوان", "فرهاد", "نیما",
              "آرش", "بابک", "پیمان", "کاوه", "سیامک", "داریوش", "مهدی", "وحید", "یاشار", "شهرام",
              "فرشاد", "کامران", "هومن", "رامین", "سینا"]
FEMALE_FIRST = ["سارا", "نگار", "مریم", "الهام", "نیلوفر", "پریسا", "شیوا", "لیلا", "آزاده", "فرزانه",
                "یگانه", "نازنین", "شبنم", "رویا", "مینا", "هانیه", "ترانه", "بهاره", "غزل", "درسا",
                "سپیده", "آیدا", "رها", "رومینا", "الناز"]
LAST_NAMES = ["رستمی", "مرادی", "احمدی", "حسینی", "کریمی", "نوری", "صادقی", "رضایی", "یوسفی", "قاسمی",
              "عزیزی", "محمدی", "طاهری", "صالحی", "جعفری", "هاشمی", "باقری", "اکبری", "شریفی", "فرهادی",
              "نجفی", "امینی", "کاظمی", "رحیمی", "شفیعی", "ملکی", "خسروی", "عباسی", "صابری", "وطن‌خواه",
              "قربانی", "زارعی", "فلاحی", "ابراهیمی", "نکویی", "پارسا", "مقدم", "بهرامی", "سلطانی", "ایزدی"]

used_names = set()


def make_name():
    while True:
        first = random.choice(MALE_FIRST if random.random() < 0.5 else FEMALE_FIRST)
        last = random.choice(LAST_NAMES)
        name = f"{first} {last}"
        if name not in used_names:
            used_names.add(name)
            return name


WEIGHTS = {
    "arc_transactional": [25, 35, 25, 10, 5],
    "arc_project": [35, 25, 20, 5, 15],
    "arc_knowledge": [15, 40, 15, 10, 20],
    "arc_coordination": [20, 25, 30, 10, 15],
    "arc_control": [15, 30, 20, 30, 5],
    "arc_management": [25, 20, 15, 15, 25],
}
DIMS = ["contribution", "quality", "reliability", "stewardship", "collective"]

DEPARTMENTS = [
    {
        "id": "dept-insurance-ops",
        "name": "Insurance Operations",
        "head": {"title": "Director of Insurance Operations"},
        "teams": [
            {
                "id": "team-claims",
                "name": "Claims Operations",
                "archetype": "arc_transactional",
                "ic_count": 6,
                "job_family": "Operations / Claims Processing",
                "work_types": ["Claim adjudication", "Payment processing", "Refund request"],
                "item_count": 14,
            },
            {
                "id": "team-underwriting",
                "name": "Underwriting Support",
                "archetype": "arc_transactional",
                "ic_count": 4,
                "job_family": "Operations / Underwriting",
                "work_types": ["Policy binding review", "Endorsement processing", "Renewal verification"],
                "item_count": 10,
            },
        ],
    },
    {
        "id": "dept-engineering",
        "name": "Engineering & Delivery",
        "head": {"title": "Director of Engineering & Delivery"},
        "teams": [
            {
                "id": "team-core-platform",
                "name": "Core Platform Engineering",
                "archetype": "arc_project",
                "ic_count": 6,
                "job_family": "Engineering / Delivery",
                "work_types": ["Integration build", "Migration cutover", "Feature implementation", "Environment hardening"],
                "item_count": 14,
            },
            {
                "id": "team-data-integration",
                "name": "Data & Integration",
                "archetype": "arc_knowledge",
                "ic_count": 4,
                "job_family": "Engineering / Data Platform",
                "work_types": ["Data pipeline build", "Connector integration", "Data quality remediation", "Reporting automation"],
                "item_count": 10,
            },
        ],
    },
    {
        "id": "dept-risk-compliance",
        "name": "Risk & Compliance",
        "head": {"title": "Director of Risk & Compliance"},
        "teams": [
            {
                "id": "team-compliance",
                "name": "Compliance & Audit",
                "archetype": "arc_control",
                "ic_count": 5,
                "job_family": "Risk & Compliance / Audit",
                "work_types": ["Control test", "Audit finding remediation", "Access review", "Risk assessment"],
                "item_count": 12,
            },
            {
                "id": "team-risk-advisory",
                "name": "Risk Advisory",
                "archetype": "arc_control",
                "ic_count": 4,
                "job_family": "Risk & Compliance / Advisory",
                "work_types": ["Risk assessment", "Control design", "Vendor risk review"],
                "item_count": 10,
            },
        ],
    },
    {
        "id": "dept-customer-legal",
        "name": "Customer & Legal",
        "head": {"title": "Director of Customer & Legal"},
        "teams": [
            {
                "id": "team-coordination",
                "name": "Customer Service Coordination",
                "archetype": "arc_coordination",
                "ic_count": 5,
                "job_family": "Customer Service Coordination",
                "work_types": ["Vendor handoff", "Ticket routing", "Escalation coordination"],
                "item_count": 12,
            },
            {
                "id": "team-legal-advisory",
                "name": "Legal & Knowledge Advisory",
                "archetype": "arc_knowledge",
                "ic_count": 3,
                "job_family": "Legal & Advisory",
                "work_types": ["Regulatory opinion", "Policy draft", "Advisory memo"],
                "item_count": 8,
            },
        ],
    },
]

LEVELS = ["Junior", "Mid", "Mid", "Senior", "Senior", "Lead"]
SOURCE_SYSTEMS = ["HRIS", "Task manager", "ERP/domain system", "CRM/case system", "DMS", "Payroll"]
EXCEPTION_TYPES = [
    ("Missed deadline", "Major", "Unrealistic deadline at assignment"),
    ("Incorrect", "Critical", "Management-created overload"),
    ("Incomplete", "Major", "Management-created overload"),
    ("Procedural non-compliance", "Critical", "Employee delay without blocker"),
    ("Missing documentation", "Major", "Employee delay without blocker"),
    ("Incorrect authorization", "Critical", "External outage or unavailable dependency"),
    ("Duplicate or unnecessary work", "Minor", "Employee delay without blocker"),
    ("Unclear / not fit for purpose", "Major", "Requirement changed after submission"),
]
RESOLUTION_STATES = ["Open", "Adjudicated", "Resolved"]

person_seq = 0
people = []
teams = []
person_index_by_id = {}


def next_person_id():
    global person_seq
    person_seq += 1
    return f"person-{person_seq:03d}"


def hire_date_for(level):
    days_ago = {"Executive": 1500, "Director": 1100, "Manager": 800}.get(level, random.randint(120, 950))
    return (datetime(2026, 8, 15) - timedelta(days=days_ago)).strftime("%Y-%m-%dT00:00:00.000Z")


def build_scores(primary, secondary, base):
    weights = WEIGHTS[primary]
    if secondary:
        sw = WEIGHTS[secondary]
        weights = [w * 0.7 + sw[i] * 0.3 for i, w in enumerate(weights)]
    periods = []
    prev_hybrid = None
    hybrids = {}
    for period in PERIODS:
        drift = random.uniform(-6, 6)
        dims = {d: max(35, min(100, round(base + drift + random.uniform(-8, 8)))) for d in DIMS}
        hybrid = round(sum(dims[d] * weights[i] / 100 for i, d in enumerate(DIMS)), 1)
        coverage = max(45, min(99, round(base - 10 + random.uniform(-10, 15))))
        confidence = "High" if coverage >= 80 else "Moderate" if coverage >= 50 else "Low"
        periods.append({
            "period": period,
            "dimensions": dims,
            "archetypeScore": hybrid,
            "hybridScore": hybrid,
            "evidenceCoveragePercent": coverage,
            "confidence": confidence,
            "sampledForValidation": random.random() < 0.35,
        })
        hybrids[period] = hybrid
    rolling = round(hybrids["2026-08"] * 0.5 + hybrids["2026-07"] * 0.3 + hybrids["2026-06"] * 0.2, 1)
    band = ("Below standard" if rolling < 60 else "Partially meets" if rolling < 75
            else "Meets standard" if rolling < 90 else "Exceeds standard")
    return {
        "periods": periods,
        "rollingScore": rolling,
        "performanceBand": band,
        "currentConfidence": periods[-1]["confidence"],
    }


def make_person(job_family, level, primary, secondary, team_id, manager_id, work_roles, responsibility_profile):
    pid = next_person_id()
    base = {"Executive": 88, "Director": 82, "Manager": 78}.get(level, random.uniform(58, 92))
    person = {
        "id": pid,
        "fullName": make_name(),
        "employeeId": f"EMP-{10000 + person_seq}",
        "jobFamily": job_family,
        "level": level,
        "managerId": manager_id,
        "primaryArchetype": primary,
        "secondaryArchetype": secondary,
        "memberships": [{
            "teamId": team_id,
            "responsibilityProfile": responsibility_profile,
            "workRoles": work_roles,
            "allocationPercent": 100,
            "startDate": hire_date_for(level),
        }],
        "scores": build_scores(primary, secondary, base),
    }
    people.append(person)
    person_index_by_id[pid] = person
    return pid


# --- Executive ---
ceo_id = make_person("Executive Leadership", "Executive", "arc_management", "arc_coordination",
                      "team-executive", None, ["assigner", "decision_owner"], "executive_profile")

dept_head_ids = []
for dept in DEPARTMENTS:
    head_id = make_person("People Management", "Director", "arc_management", dept["teams"][0]["archetype"],
                           f"team-{dept['id']}", ceo_id, ["assigner", "decision_owner"], "department_head_profile")
    dept["head_id"] = head_id
    dept_head_ids.append(head_id)

leaf_teams = []
for dept in DEPARTMENTS:
    dept_team_members = []
    for team in dept["teams"]:
        manager_id = make_person("People Management", "Manager", "arc_management", team["archetype"],
                                  team["id"], dept["head_id"], ["assigner", "decision_owner"], "people_manager_profile")
        member_ids = [manager_id]
        for _ in range(team["ic_count"]):
            level = random.choice(LEVELS)
            secondary = None
            if random.random() < 0.3:
                secondary = random.choice([a for a in WEIGHTS if a != team["archetype"]])
            work_roles = random.sample(["executor", "contributor", "reviewer", "planner"], k=2)
            ic_id = make_person(team["job_family"], level, team["archetype"], secondary,
                                 team["id"], manager_id, work_roles, "individual_contributor_profile")
            member_ids.append(ic_id)
        dept_team_members.append(manager_id)
        teams.append({
            "id": team["id"],
            "name": team["name"],
            "department": dept["name"],
            "dominantArchetype": team["archetype"],
            "managerId": manager_id,
            "memberIds": member_ids,
            "memberCount": len(member_ids),
        })
        leaf_teams.append({**team, "managerId": manager_id, "memberIds": member_ids})
    teams.append({
        "id": f"team-{dept['id']}",
        "name": dept["name"],
        "department": dept["name"],
        "dominantArchetype": "arc_management",
        "managerId": dept["head_id"],
        "memberIds": dept_team_members,
        "memberCount": len(dept_team_members),
    })

teams.append({
    "id": "team-executive",
    "name": "Executive Leadership",
    "department": "Executive Leadership",
    "dominantArchetype": "arc_management",
    "managerId": ceo_id,
    "memberIds": dept_head_ids,
    "memberCount": len(dept_head_ids),
})

assert len(people) == 50, f"expected 50 people, got {len(people)}"

# --- Work items, events, exceptions, evidence ledger ---
work_items = []
evidence_ledger = []
wi_seq = 0
ev_seq = 0
evt_seq = 0

START = datetime(2026, 7, 1)


def rand_day(offset_max=45):
    return (START + timedelta(days=random.randint(0, offset_max), hours=random.randint(8, 18))).strftime("%Y-%m-%dT%H:00:00.000Z")


def next_ids(prefix, seq):
    return f"{prefix}-{seq:04d}"


for team in leaf_teams:
    members = team["memberIds"]
    ic_members = [m for m in members if m != team["managerId"]]
    reviewer_pool = [m for m in members if m != team["managerId"]] or members
    for i in range(team["item_count"]):
        wi_seq += 1
        wid = next_ids("wi", wi_seq)
        work_type = random.choice(team["work_types"])
        origin = random.choices(
            ["Task manager", "KPI", "OKR", "Resolution"],
            weights=[0.55, 0.20, 0.15, 0.10],
        )[0]
        factors = {k: random.randint(0, 3) for k in ["scope", "uncertainty", "coordination", "risk"]}
        total = sum(factors.values())
        band = "Routine" if total <= 2 else "Standard" if total <= 5 else "Complex" if total <= 8 else "Exceptional"
        work_units = {"Routine": 1, "Standard": 2, "Complex": 4, "Exceptional": 8}[band]
        executor = random.choice(ic_members) if ic_members else team["managerId"]
        contributor = executor if random.random() < 0.6 else random.choice(members)
        reviewer = random.choice([m for m in reviewer_pool if m != executor] or [team["managerId"]])
        role_assignments = {
            "requester": random.choice(members),
            "planner": team["managerId"],
            "assigner": team["managerId"],
            "decision_owner": random.choice([team["managerId"], executor]),
            "executor": executor,
            "contributor": contributor,
            "reviewer": reviewer,
        }
        has_exception = random.random() < 0.12
        exception = None
        attribution_cause = None
        if has_exception:
            etype, severity, cause = random.choice(EXCEPTION_TYPES)
            exception = {
                "type": etype,
                "severity": severity,
                "raisedBy": reviewer,
                "raisedAgainst": executor,
                "raisedAt": rand_day(),
                "resolutionState": random.choice(RESOLUTION_STATES),
            }
            attribution_cause = cause
        elif random.random() < 0.08:
            attribution_cause = random.choice([
                "External outage or unavailable dependency",
                "Unrealistic deadline at assignment",
                "Management-created overload",
            ])

        assigned_at = rand_day(20)
        events = []

        def add_event(event_type, category, actor, role, at):
            global evt_seq
            evt_seq += 1
            events.append({
                "id": next_ids("evt", evt_seq),
                "eventType": event_type,
                "category": category,
                "occurredAt": at,
                "actorId": actor,
                "responsibilityRole": role,
                "workItemId": wid,
            })

        t0 = datetime.strptime(assigned_at, "%Y-%m-%dT%H:%M:%S.000Z")
        add_event("Assigned", "work", team["managerId"], "assigner", assigned_at)
        add_event("Started", "work", executor, "executor", (t0 + timedelta(days=1)).strftime("%Y-%m-%dT%H:00:00.000Z"))
        if exception and exception["type"] == "Missed deadline":
            add_event("Blocked", "work", executor, "executor", (t0 + timedelta(days=2)).strftime("%Y-%m-%dT%H:00:00.000Z"))
            add_event("Unblocked", "work", team["managerId"], "assigner", (t0 + timedelta(days=4)).strftime("%Y-%m-%dT%H:00:00.000Z"))
        submit_day = t0 + timedelta(days=random.randint(3, 8))
        add_event("Submitted", "work", executor, "executor", submit_day.strftime("%Y-%m-%dT%H:00:00.000Z"))
        add_event("Artifact linked", "control", executor, "executor", (submit_day + timedelta(hours=6)).strftime("%Y-%m-%dT%H:00:00.000Z"))
        sampled = random.random() < 0.4
        if sampled:
            add_event("Sample selected", "control", reviewer, "reviewer", (submit_day + timedelta(days=1)).strftime("%Y-%m-%dT%H:00:00.000Z"))
            add_event("Sample reviewed", "control", reviewer, "reviewer", (submit_day + timedelta(days=3)).strftime("%Y-%m-%dT%H:00:00.000Z"))
        if exception and exception["resolutionState"] == "Open" and random.random() < 0.5:
            add_event("Returned", "work", reviewer, "reviewer", (submit_day + timedelta(days=2)).strftime("%Y-%m-%dT%H:00:00.000Z"))
            add_event("Reopened", "work", executor, "executor", (submit_day + timedelta(days=3)).strftime("%Y-%m-%dT%H:00:00.000Z"))
        else:
            add_event("Accepted", "work", reviewer, "reviewer", (submit_day + timedelta(days=2)).strftime("%Y-%m-%dT%H:00:00.000Z"))
            add_event("Result approved", "governance", role_assignments["decision_owner"], "decision_owner",
                      (submit_day + timedelta(days=4)).strftime("%Y-%m-%dT%H:00:00.000Z"))
        if exception and exception["severity"] == "Critical":
            add_event("Score disputed", "governance", executor, "executor", (submit_day + timedelta(days=5)).strftime("%Y-%m-%dT%H:00:00.000Z"))
            if exception["resolutionState"] != "Open":
                add_event("Score adjudicated", "governance", team["managerId"], "assigner", (submit_day + timedelta(days=7)).strftime("%Y-%m-%dT%H:00:00.000Z"))

        evidence_ids = []
        for _ in range(random.randint(1, 3)):
            ev_seq += 1
            eid = next_ids("ev", ev_seq)
            source = random.choice(SOURCE_SYSTEMS)
            state = "Rejected" if (exception and exception["severity"] == "Critical" and random.random() < 0.4) \
                else "Pending" if random.random() < 0.15 else "Verified"
            evidence_ledger.append({
                "id": eid,
                "workItemId": wid,
                "type": random.choice(["accepted_work", "control_result", "artifact", "decision_record"]),
                "sourceSystem": source,
                "artifactReference": f"doc://{team['id']}/{wid}/{eid}.pdf",
                "verificationState": state,
                "metadataHash": hashlib.md5(f"{wid}{eid}".encode()).hexdigest(),
                "capturedAt": rand_day(30),
            })
            evidence_ids.append(eid)

        work_items.append({
            "id": wid,
            "teamId": team["id"],
            "archetype": team["archetype"],
            "workType": work_type,
            "origin": origin,
            "complexity": {"factors": factors, "total": total, "band": band, "workUnits": work_units},
            "roleAssignments": role_assignments,
            "evidenceIds": evidence_ids,
            "exception": exception,
            "attributionCause": attribution_cause,
            "events": events,
        })

data = {
    "meta": {
        "generatedFor": "EvalCore mock data set",
        "generatedAt": datetime(2026, 9, 12, 9, 0, 0).strftime("%Y-%m-%dT%H:%M:%S.000Z"),
        "note": "Fictional data generated for UI/UX and QA purposes only. Fifty-person organization with a four-level management hierarchy (executive, department head, team manager, individual contributor) across eight teams in four departments.",
        "periods": PERIODS,
    },
    "referenceData": {
        "archetypes": [
            {"id": k, "name": k.replace("arc_", "").capitalize(), "weights": dict(zip(DIMS, v))}
            for k, v in WEIGHTS.items()
        ],
    },
    "teams": teams,
    "people": people,
    "workItems": work_items,
    "evidenceLedger": evidence_ledger,
}

with open("src/mvp/mockData.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

print(f"people={len(people)} teams={len(teams)} workItems={len(work_items)} evidence={len(evidence_ledger)} events={sum(len(w['events']) for w in work_items)}")

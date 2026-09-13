# EvalCore

An evidence-based employee performance and governance workspace. See
[README_MVP.md](README_MVP.md) for the working feature list, demo walkthrough
and rules, and [ARCHITECTURE.md](ARCHITECTURE.md) for the application layers.

## Run

Node.js 24 or newer.

```
npm install
npm run dev      # http://localhost:3000
npm run build    # production bundle
npm run lint     # type-check
npm test         # domain engine tests
```

## Data

The seeded organization (`src/mvp/mockData.json`) is fifty fictional people
across eight teams in four departments, with a four-level management
hierarchy (executive → department head → team manager → individual
contributor), work items, canonical events and an evidence ledger. Regenerate
it with `python3 scripts/generate_org_data.py`. See
[DATA_REQUIREMENTS.md](DATA_REQUIREMENTS.md) for the full production data
catalog this MVP is a stand-in for.

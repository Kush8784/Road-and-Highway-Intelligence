# Project Tracker

Status legend: ✅ done · 🟡 in progress · ⬜ not started · ⛔ blocked

_Last updated: 2026-09-28_

## Phase 0 — Specification & prototype (this delivery)

| # | Item | Status | Notes |
|---|---|---|---|
| 0.1 | Six context docs (overview, architecture, standards, AI workflow, UI, tracker) | ✅ | `docs/` |
| 0.2 | 15-part product/build specification | ✅ | `docs/spec/` |
| 0.3 | Relational + PostGIS schema | ✅ | `db/schema.sql`; loads cleanly (validated on PG16 with geometry shimmed) |
| 0.4 | Sample dataset — 16 real projects, 48 sources | ✅ | `dashboard/data/sample-data.js`; researched 2026-09-28 |
| 0.5 | Seed generator + seed SQL | ✅ | `tools/build-seed.js` → `db/seed_sample.sql` |
| 0.6 | Prototype dashboard, views A–M + project drawer | ✅ | `dashboard/index.html`; offline, no deps |
| 0.7 | Basemap build script | ✅ | `tools/build-basemap.js` (DataMeet, CC BY 4.0) |

## Phase 1 — Foundation (weeks 1–6)

| # | Item | Status | Notes |
|---|---|---|---|
| 1.1 | Postgres + PostGIS infra, migrations tooling | ⬜ | |
| 1.2 | Survey of India–compliant state/district boundaries (with LGD codes) | ⬜ | Replace prototype basemap; J&K/Ladakh split |
| 1.3 | Source capture service (Playwright, object storage, sha256) | ⬜ | |
| 1.4 | Claim extraction (LLM, JSON schema) for PIB, NHAI, MoRTH, state portals | ⬜ | |
| 1.5 | Entity resolution v1 (companies, authorities, projects) + analyst queue | ⬜ | |
| 1.6 | FastAPI read API (projects, packages, companies, search, geo) | ⬜ | |

## Phase 2 — Coverage (weeks 6–14)

| # | Item | Status | Notes |
|---|---|---|---|
| 2.1 | Package-level ingestion for DME (54 pkgs), Samruddhi, BCE, DAK, Ganga | ⬜ | Sample has corridor-level only |
| 2.2 | CPPP / eProcure tender feed + award results | ⬜ | Tender IDs, bidders, qualifications |
| 2.3 | Contractor filings (order-book disclosures, exchange announcements) | ⬜ | Verify awards to Tier 2 |
| 2.4 | Consultants (AE/IE/DPR) from authority award notices | ⬜ | None verified yet |
| 2.5 | Alignments from official maps / OSM where licensed; precision upgrade | ⬜ | All sample geometry is APPROXIMATE |
| 2.6 | All states/UTs: materiality-filtered discovery sweep | ⬜ | |

## Phase 3 — Product (weeks 10–18)

| # | Item | Status | Notes |
|---|---|---|---|
| 3.1 | React + MapLibre frontend replacing prototype | ⬜ | Keep view IA A–M |
| 3.2 | OpenSearch global search | ⬜ | |
| 3.3 | Excel / PDF briefing exports (server-side) | ⬜ | Prototype: CSV, JSON, print-to-PDF |
| 3.4 | Sales/account layer (tenant-private) | ⬜ | |
| 3.5 | RAG analyst assistant with mandatory citations | ⬜ | |

## Open verification items from the sample

| Project | Item |
|---|---|
| Delhi–Mumbai Expressway | Map 54 packages → contractors; primary source for ₹96,547 cr sanctioned cost |
| Zojila Tunnel | Primary (NHIDCL/PIB) confirmation of 9 Jun 2026 breakthrough; award value |
| Mumbai Coastal Road | Resolve Package 2 vs "2 and 3" attribution to HCC–HDC JV; primary BMC cost |
| Dwarka Expressway | Tier 1–2 confirmation of Pkg 1 (J Kumar ₹1,349 cr); Pkgs 2–3 contractors |
| Sela Tunnel | Pin Patel Engineering attribution to a BRO/company document |
| Shaktipeeth Expressway | Resolve ₹86,300 cr vs ₹20,787 cr; confirm 2022 tender claim; revised alignment length |
| Vadhavan freight corridor | Implementing agency, cost, alignment |
| Delhi–Amritsar–Katra | Primary confirmation of Jul-2026 openings; package contractors |
| Pune Ring Road | Eastern package contractors E1–E4; E5–E7 outcome; total length/cost |
| All | Capture publication dates for 20+ sources lacking them |

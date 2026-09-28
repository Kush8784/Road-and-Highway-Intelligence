# 1 · Product Concept

## What ITIS is

An **intelligence system**, not a dashboard: a continuously researched, evidence-linked database of India's transport infrastructure projects, presented through a map-first analyst terminal.

> Start at "what is happening with Indian infrastructure?" and drill to
> **India → Maharashtra → Expressways → Mumbai–Nagpur → Package 7 → Contractor → JV partner → Contract value → Project Director → Current status → Tender history → Sources.**

## The five layers

| Layer | Role | Primary objects |
|---|---|---|
| **Database — foundation** | One canonical record per project, package, contract, company, authority | `projects`, `packages`, `contracts`, `contract_parties`, `companies`, `authorities` |
| **Research engine — intelligence** | Agents discover, extract and verify; every fact becomes a sourced claim | `sources`, `raw_documents`, `claims`, `data_conflicts` |
| **Map — primary interface** | Where everything is, at what precision | `project_locations` (point / line / polygon) |
| **Relationship graph — network** | Who works with whom, for which authority | `contract_parties`, `project_participants` |
| **Tender pipeline — opportunity** | What will be procured next, with dated evidence | `tender_records`, `opportunity_signals` |
| **Timeline — institutional memory** | What changed, when, and who said so | `project_events` (append-only) |

## What makes it different

1. **Evidence is the product.** Every number has a source, a tier, a date and a confidence. Unknowns are shown as unknowns.
2. **Package-level truth.** Corridors are never attributed to one contractor; JVs are never collapsed.
3. **Conflicts are visible.** ₹7,811 cr vs ₹10,507 cr is shown as *initial vs revised*, not silently resolved.
4. **History is preserved.** A project that was *Proposed → DPR → Tendered → Awarded → Under construction* keeps every step.
5. **Forward view without speculation.** The Opportunity Radar lists only documented signals (approval, budget line, tender notice, cancellation), with their dates.
6. **Commercial layer, cleanly separated.** Technology needs are labelled *documented* vs *potential*; inferred suppliers never appear as participants.

## Primary questions answered (from the brief)

| # | Question | Where |
|---|---|---|
| 1–5 | What exists; completed; under construction; planned/tendered/awarded; cancelled/delayed/stalled/rebid | Map, KPIs, Pipeline, Project Explorer |
| 6–10 | Owner/sponsor; awarding authority; contractor/JV; construction companies; consultants/technology | Project drawer "Who built it?", Contract structure |
| 11–13 | Project value; contract value; planned vs actual dates | Drawer financials & timeline; Tender Intel |
| 14–16 | Location; states/districts/cities; packages | Map, State Explorer, Corridor Explorer |
| 17 | Repeat winners | Contractor Intel (factual counts, not rankings) |
| 18–19 | Future pipeline; largest opportunities | Opportunity Radar, Pipeline (value per stage) |
| 20 | Sales / BD use | Radar + Graph + sales layer (`technology_requirements`) |

## Users & jobs-to-be-done
See `docs/PROJECT_OVERVIEW.md`.

## Success measures
- ≥ 95 % of displayed facts carry a Tier 1–2 source (v1 target by end of Phase 2).
- Median status age < 120 days for active projects.
- Package-level contractor coverage ≥ 80 % for projects ≥ ₹1,000 cr.
- Zero inferred participants (enforced by constraint).

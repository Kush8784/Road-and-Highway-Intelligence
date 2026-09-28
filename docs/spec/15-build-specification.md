# 15 · Build Specification

Enough for a team to start without redesigning the information architecture. Read with specs 02 (IA), 03 (schema), 06 (DQ), 07 (UI) and `docs/ARCHITECTURE_CONTEXT.md` (invariants).

## API (v1, read-only for clients)

| Method & path | Returns | Key params |
|---|---|---|
| `GET /projects` | Paged project summaries (id, name, type, status+asof, states, authority, contractors, reference value + conflict flag, length, confidence, dq_score, last_verified) | `state, district, type, status, status_group, authority, company, corridor, highway, min_value, max_value, year_from, year_to, q, bbox, sort, page` |
| `GET /projects/{id}` | Full record: aliases, states/districts, values[], packages[] (contracts, parties), participants[], events[], updates[], risks[], tech_requirements[], signals[], stakeholders[], locations (GeoJSON), sources[], freshness | |
| `GET /projects/{id}/briefing.pdf` | Server-rendered briefing with source appendix | |
| `GET /packages?project_id=` · `GET /tenders` · `GET /contracts` | Procurement records | `authority, status, from, to, company` |
| `GET /companies` · `GET /companies/{id}` | Company profile + metrics (see `v_contractor_metrics`) + relationships | `sort=value|projects|km|active` (metric echoed in response) |
| `GET /authorities` · `GET /authorities/{id}` | Authority profile + aggregates | |
| `GET /states` · `GET /states/{code}` | State aggregates (value/km **not apportioned** flag) | |
| `GET /corridors/{id}` | Corridor with packages & contractors | |
| `GET /radar` | Opportunity signals by category | `state, authority, category, since` |
| `GET /graph` | Nodes/edges for filter | `focus=company:C-LT, depth=2` |
| `GET /geo/projects.geojson` · `GET /tiles/{z}/{x}/{y}.mvt` | Geometry with `precision` property | filters as `/projects` |
| `GET /search?q=` | Mixed entity results (project/company/authority/state/tender/stakeholder) | |
| `GET /quality` · `GET /sources` | DQ metrics & per-record scores; source register | |
| `GET /export/{entity}.csv|xlsx` | Exports honouring filters | |

All responses carry `as_of` and, for facts, `source_ids`. Money in INR crore (number) plus formatted string.

## Acceptance criteria (Phase 1–3 exit)

**Data**
- [ ] Loading any record without `source_id` on an evidence table fails.
- [ ] JV contracts show every member with role and share (when disclosed); no concatenated JV names anywhere.
- [ ] A project with two unexplained cost values has no reference value and appears in "Conflicting values".
- [ ] Changing a status creates a new event; previous statuses remain visible in the timeline.
- [ ] Status older than 365 days is flagged stale in list, drawer and DQ centre.
- [ ] No participant row has confidence INFERRED (DB-enforced).

**Map**
- [ ] All 36 states/UTs render with Survey of India–compliant boundaries; J&K and Ladakh separate.
- [ ] Every geometry shows its precision; APPROXIMATE is visually distinct and labelled.
- [ ] Status is distinguishable in greyscale (glyph + dash).

**Interaction**
- [ ] Click state → all views filter; click authority within → intersection; click project → drawer; click contractor → all its projects (brief §44 flow passes end-to-end).
- [ ] The eight account-targeting queries in brief §29 are answerable via filters/search/graph, and "expected to tender within 12 months" returns only items with a sourced expected timing.
- [ ] Search returns project, status, value, contractor, authority, location, source per row.

**Quality & performance**
- [ ] p95 API < 300 ms for list endpoints at 50k projects; map renders 20k lines at ≥ 40 fps with clustering.
- [ ] No horizontal scroll at 390 px; keyboard reachable; WCAG AA contrast both themes.

## Brief §29 queries → implementation
| Query | Implementation |
|---|---|
| Every project involving Company X | `/companies/{id}` relationships; UI: search → contractor view / graph |
| Every project awarded by NHAI | `/projects?authority=A-NHAI` (+ packages with contracts) |
| Upcoming road projects in Maharashtra | `/projects?state=IN-MH&status_group=proposed,tendered` + `/radar?state=IN-MH` |
| Tunnel projects under construction | `/projects?type=Tunnel&status_group=construction,delayed,stalled` |
| Projects above ₹1,000 cr | `/projects?min_value=1000` (reference value; conflicted projects listed separately) |
| Contractors active in Maharashtra and Gujarat | `/companies?active_in=IN-MH,IN-GJ&mode=all` |
| Companies in > 5 projects | `/companies?min_projects=6` |
| Expected to tender within 12 months | `/radar?category=TENDER_EXPECTED&timing_within=12m` — **only** signals with `expected_timing_text` from a dated source; others listed as "timing not documented" |

## Milestones

| Phase | Weeks | Exit |
|---|---|---|
| 0 Spec & prototype | done | This repository |
| 1 Foundation | 1–6 | Postgres/PostGIS, capture service, claim extraction for PIB + NHAI + 3 state RDCs, ER v1, read API; 200 projects |
| 2 Coverage | 6–14 | Tender portals, exchange filings, consultants, all states sweep; package-level for top 50 corridors; 1,500 projects |
| 3 Product | 10–18 | React/MapLibre app, OpenSearch, exports, RAG assistant, sales layer; acceptance criteria green |
| 4 Operate | ongoing | Freshness SLAs met; DQ score ≥ 70 median; ≥ 95 % facts Tier 1–2 |

## Team (indicative)
1 product lead · 2 data engineers (pipeline, ER) · 1 backend · 2 frontend (map, app) · 1 GIS · 2–3 infrastructure research analysts (queue review) · part-time designer.

## Definition of done (every item)
Code + migration + tests; seed/sample updated if the model changed; docs (`PROJECT_TRACKER`, relevant spec) updated; UI change screenshotted in both themes and at 390 px.

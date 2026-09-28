# 3 · Database Architecture

Authoritative DDL: [`db/schema.sql`](../../db/schema.sql) (PostgreSQL 16 + PostGIS 3, schema `itis`). Seed: [`db/seed_sample.sql`](../../db/seed_sample.sql), generated from the sample dataset by `tools/build-seed.js`.

Validated 2026-09-28: schema + seed load with `ON_ERROR_STOP` on PostgreSQL 16 (geometry columns shimmed to text because PostGIS was not installed in the build container); 16 projects, 23 packages, 20 contracts, 24 contract parties, 35 events load; the append-only trigger rejects `UPDATE project_events`; the unique `url_normalised` constraint caught a duplicate source during testing.

## Entity–relationship overview

```
authorities ─┬─< projects >── corridors
             │     │  ├──< project_aliases / project_states / project_districts / project_cities
             │     │  ├──< project_values        (all reported values, one flagged reference)
             │     │  ├──< project_events        (append-only status history)
             │     │  ├──< project_updates       (progress)
             │     │  ├──< delay_risks           (documented causes only)
             │     │  ├──< project_locations     (PostGIS, precision-flagged)
             │     │  ├──< technology_requirements (documented | potential)
             │     │  ├──< opportunity_signals
             │     │  ├──< funding
             │     │  ├──< project_participants >── companies   (consultants, AE/IE, tech, O&M)
             │     │  └──< stakeholders
             │     └──< packages ──< tender_records ──< tender_bids
             │                  └──< contracts ──< contract_parties >── companies ──< company_aliases
             └──< authority_aliases
sources ──< (every evidence table) ;  sources ──< raw_documents ;  claims ──> sources ;  data_conflicts ──> claims
```

## Recommended tables (from the brief) → implementation

| # | Brief | Table(s) |
|---|---|---|
| 1 | Projects | `projects`, `project_aliases`, `project_states`, `project_districts`, `project_cities` |
| 2 | Packages | `packages` |
| 3 | Contracts | `contracts` |
| 4 | Companies | `companies`, `company_aliases` |
| 5 | JV Members | `contract_parties` (one row per member, `share_pct`, `role`) |
| 6 | Authorities | `authorities`, `authority_aliases` |
| 7 | Consultants | `project_participants` (`role_group` = Engineering / Project management) |
| 8 | Stakeholders | `stakeholders` |
| 9 | Project Events | `project_events` |
| 10 | Tender Records | `tender_records`, `tender_bids` |
| 11 | Sources | `sources`, `raw_documents`, `claims`, `data_conflicts` |
| 12 | Project Locations | `project_locations`, `states`, `districts` |
| 13 | Project Updates | `project_updates` |
| 14 | Technology Requirements | `technology_requirements` |
| 15 | Company-Project Relationships | `contract_parties` + `project_participants` (+ view `v_contractor_metrics`) |
| + | Money, risk, opportunity | `project_values`, `funding`, `delay_risks`, `opportunity_signals` |

## Field specifications (core tables)

Legend: **Req** = NOT NULL. *Source* = where the value normally comes from.

### projects
| Field | Type | Description | Req | Example | Source |
|---|---|---|---|---|---|
| project_id | text PK | Stable ID `ITI-P-NNNN` | ✓ | ITI-P-0003 | system |
| canonical_name | text | Canonical name (aliases separate) | ✓ | Mumbai Trans Harbour Link (Atal Setu) | authority |
| project_type | text (CHECK) | Expressway, Bridge, Tunnel, … | ✓ | Bridge | analyst |
| category | text | Finer class | | Sea bridge | authority / press |
| corridor_id | FK corridors | Parent corridor | | CR-SEWRI-NHAVA-SHEVA | analyst |
| highway_no | text | NH / NE number | | NE-4 | MoRTH |
| programme | text | Bharatmala, state programme | | Bharatmala Pariyojana | PIB |
| origin / destination | text | End points as published | | Sewri (Mumbai) / Chirle | authority |
| length_km | numeric(9,3) | Reported length | | 21.8 | authority |
| length_basis | text | How length was derived | | Sum of 3 packages (S006) | analyst |
| lanes, structure_type, terrain, strategic_importance | text | Descriptors | | 6 · Marine | DPR / press |
| nodal_ministry_id … concessioning_authority_id | FK authorities | Role-specific authorities (never assumed) | | A-MMRDA | authority |
| government_level | text | Central/State/Municipal/Joint | | State | analyst |
| record_confidence | enum | Overall record confidence | ✓ | REPORTED | DQ engine |
| last_verified | date | Last human/agent verification | | 2026-09-28 | pipeline |
| merged_into | FK projects | Dedup tombstone | | | ER |

### packages
| Field | Type | Description | Req | Example | Source |
|---|---|---|---|---|---|
| package_id | bigserial PK | | ✓ | | system |
| project_id | FK | | ✓ | ITI-P-0012 | |
| package_no | text | As published | ✓ | PRR-W1 | tender |
| name, start_location, end_location | text | | | | tender |
| length_km | numeric | | | 14.65 | tender / press |
| scheduled_completion, actual_completion | date | | | | contract / authority |
| progress_pct, progress_asof | numeric, date | Latest physical progress | | 19 · 2026-01-19 | authority / press |
| record_confidence, source_id | | | | REPORTED · S031 | |

### tender_records / tender_bids
| Field | Type | Description | Req | Example |
|---|---|---|---|---|
| portal, portal_tender_ref | text | CPPP / state portal + tender ID (unique pair) | | eprocure · 2024_NHAI_12345 |
| title, notice_date, bid_due_date | text, date | | title ✓ | |
| estimated_value_cr | numeric | Authority estimate | | |
| tender_type, procurement_model | text (CHECK) | Open/limited; EPC/HAM/BOT/DBFOT/… | | HAM |
| min_turnover_cr, similar_work_criteria, qualification_other | numeric, text, jsonb | Qualification requirements | | |
| tender_status | text | expected/issued/bid_evaluation/awarded/cancelled/re_tendered | | bid_evaluation |
| tender_bids.bidder_label, lead_company_id, bid_value_cr, rank, technically_qualified | | Each disclosed bid | label ✓ | "MEIL", L1 |

### contracts / contract_parties
| Field | Type | Description | Req | Example |
|---|---|---|---|---|
| contracts.package_id | FK | | ✓ | |
| contract_type | text (CHECK) | EPC/HAM/BOT/DBFOT/O&M/Consultancy/…/Unknown | ✓ | Unknown (not stated in source) |
| jv_name | text | Registered JV / SPV name | | |
| award_date (+precision), loa_date, agreement_date, appointed_date | date | Kept distinct; `award_date` used when source doesn't distinguish | | 2017-12 (month) |
| award_value_cr | numeric | Contract value | | 7637.30 |
| duration_months, concession_years | | | | |
| contract_status | text | active/completed/terminated/foreclosed/disputed | | completed |
| contract_parties.company_id | FK | One row per member | ✓ | C-IHI |
| role | text (CHECK) | Sole contractor / JV lead / JV member / Consortium member / Concessionaire / Subcontractor / Specialist | ✓ | Consortium member |
| share_pct | numeric | JV share if disclosed | | 55 |
| original_name_in_source | text | Exact spelling in source | ✓ | Larsen and Toubro |

### project_values
| Field | Type | Description | Req | Example |
|---|---|---|---|---|
| value_cr | numeric(14,2) | INR crore | ✓ | 10507 |
| value_type | text (CHECK) | estimated, sanctioned, revised, award, expenditure_to_date, budget_allocation, headline, reported_cost, cost_variation, computed_sum, … | ✓ | revised |
| value_type_detail | text | Source wording | | Cost of identified stretches (revised) |
| includes_land / includes_gst | bool | When stated | | |
| as_of_date (+precision) | date | | | 2026-03 |
| is_reference / reference_reason | bool / text | Display value, only with a reason; ≤1 per project | | "Most specific whole-project cost reported" |
| discrepancy_note | text | Explanation (initial vs revised, project vs contract, …) | | |

### project_events (append-only)
event_date (nullable, never guessed) · date_precision · event_type · status_code (only when the event asserts a status; milestones leave it NULL) · description · record_confidence · source_id ✓.

### project_locations
role (centroid / start / end / alignment / schematic / portal / structure / toll_plaza / influence_area / construction_zone) · `geometry(Geometry,4326)` · precision (SURVEYED / OFFICIAL_MAP / DIGITISED / APPROXIMATE) · basis ✓ · is_planned · source_id (required unless APPROXIMATE).

### Other evidence tables
`delay_risks` (15 documented categories), `technology_requirements` (documented requires source; potential requires basis), `opportunity_signals` (category + signal type + date + source ✓ + last_verified ✓; `expected_timing_text` only when sourced), `project_participants` (confidence ≠ INFERRED), `stakeholders` (public professional role only, source ✓), `funding`, `project_updates`.

## Keys & integrity
- Natural IDs are text with prefixes (`ITI-P-`, `C-`, `A-`, `S`) to stay stable across re-loads; surrogate `bigserial` for high-volume children.
- Composite PKs on join tables (`project_states`, `contract_parties`, aliases).
- Partial unique index: one reference value per project.
- Trigram GIN indexes on names/aliases for resolution & search; GiST on geometry.

## Read models
- `v_project_current_status` — latest *dated* status-bearing project-level event; undated events never win.
- `v_contractor_metrics` — projects, packages, attributed value (JV counted in full per member), share-weighted value (only where disclosed), km, active/completed contracts, authorities.
- Production adds materialised views for state/authority/corridor aggregates and the DQ score (see spec 06).

## What the schema deliberately does *not* have
- No `contractor_name` text column on projects or packages (would collapse JVs).
- No single `project_cost` column (would force choosing a value).
- No `status` column that can be overwritten (status is derived from events).

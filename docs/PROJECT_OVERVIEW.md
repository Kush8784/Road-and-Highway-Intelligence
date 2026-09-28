# Project Overview — ITIS

**India Transport Infrastructure Intelligence System (ITIS)** is an evidence-first intelligence platform for India's roads, highways, expressways, bridges, tunnels and associated corridor systems. It joins four layers:

| Layer | What it holds | Where it lives |
|---|---|---|
| **Foundation** | Normalised project / package / contract / company database | `db/schema.sql` |
| **Geography** | Points, lines, polygons with precision flags | `project_locations` (PostGIS) · map UI |
| **Network** | Authority → project → package → contract → JV member → consultant → vendor | `contract_parties`, `project_participants` · graph view |
| **Institutional memory** | Append-only status history with sources | `project_events` · timeline view |
| **Opportunity** | Documented, dated procurement signals | `opportunity_signals` · radar view |

## Who it is for

| User | Core question | Primary views |
|---|---|---|
| Infrastructure sales / BD (EPC suppliers, tech & IT vendors) | "Which projects will buy what, from whom, and when?" | Opportunity Radar, Contractor Intel, Graph, Project detail |
| Account managers | "Show me every project involving Company X" | Search, Contractor Intel, Graph |
| Strategy / research analysts | "Where is investment going, by state, authority, year?" | Map, State Explorer, Authority Intel, Tender Intel |
| Investors / lenders | "Who is exposed to which delays?" | Project detail (risks), Contractor Intel |
| Data / research team | "What is unverified or stale?" | Data Quality, Evidence Explorer |

## Core workflows

1. **Top-down exploration:** India map → state → type → corridor → project → package → contractor/JV → contract value → sources.
2. **Account lookup:** search a company → all projects, packages, JV partners, authorities, states, values.
3. **Pipeline review:** Opportunity Radar → filter by state/authority → open evidence → export briefing.
4. **"Who built it?"** — project detail answers owner, awarder, designer, supervisor, financier, contractor, JV partners, specialists, technology providers, operator — or explicitly says *not yet sourced*.
5. **Research maintenance:** Data Quality → lowest-confidence / stale records → research agent re-verifies → new events appended.

## Scope

**In scope:** NH / SH / significant MDR & urban roads, ring roads, bypasses, widening/strengthening of material value, elevated roads, flyovers, interchanges; greenfield/brownfield expressways and economic corridors; major bridges (sea, river, cable-stayed, viaducts); road tunnels; and — where documented — toll, ITS/ATMS, tunnel management, surveillance, WIM, EV charging and corridor digital infrastructure. All states and UTs.

**Materiality filter (default):** include a project if any holds — value ≥ ₹500 cr; length ≥ 20 km; tunnel ≥ 1 km; bridge ≥ 1 km or any sea/cable-stayed/suspension bridge; strategic (BRO/NHIDCL border); part of a named corridor/programme. Routine maintenance contracts are excluded.

**Out of scope (v1):** rail, metro, airports, ports (except road connectivity packages), private real-estate roads.

## Non-negotiable research rules

Never invent data, contractors, values, status or coordinates · attach a source to every fact · separate verified vs inferred · keep conflicting values side by side · never present old status as current · never delete history. See `docs/spec/05-research-agent-instructions.md`.

## Current state

A working prototype dashboard (`dashboard/`) over a **sample dataset of 61 real projects, 128 cited sources and 35 companies** (researched 2026-09-28), including each contractor's researched lifetime portfolio, the complete relational schema with a seed generated from the same data, and the full build specification (`docs/spec/`). See `docs/PROJECT_TRACKER.md`.

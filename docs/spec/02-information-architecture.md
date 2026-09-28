# 2 · Information Architecture

## Hierarchies

**Geographic:** India → Region → State/UT → District → City/Town → Corridor → Project → Package → Contract
**Procurement:** Corridor → Project → Package → Tender → Contract → Contractor → JV members → Consultants → Sub-contractors → Technology providers
**Organisational:** Nodal ministry → Implementing / awarding / executing authority → Project

## Global chrome (every view)

| Element | Behaviour |
|---|---|
| Global search (`/`) | Projects, aliases, corridors, highways, states, cities, contractors, JV members, authorities, package numbers, tender IDs, project directors. Result row: project · status · value · contractor · authority · location · source. Company/authority/state results apply a filter. |
| Filter bar | State · Type · Status group · Authority · Company · Min value (+ in production: district, corridor, highway, year, tender status, project size). All views cross-filter. Removable chips. |
| KPI strip | Total projects · Σ reference value · Under construction · Completed · Planned · Tendered · With awarded packages · Delayed · Stalled · Total km · Expressway km · Bridges · Tunnels · Active contractors · Active authorities. Each is clickable (applies filter or opens view). |
| Sample/as-of flag | Always visible; shows dataset date. |
| Project drawer | Opens from any project reference anywhere. |

## Views (A–M)

| ID | View | Analytical question | Main components | Drill-downs |
|---|---|---|---|---|
| A·B | **Executive + India Map** | Where is activity, at which stage? | National map (states + project lines/points), legend toggles, lifecycle pipeline (projects · ₹cr · km by stage), latest dated events feed | State click → state filter; project click → drawer; stage click → list with state & contractor distribution |
| C | **State Explorer** | What is happening in each state? | State table (projects, value, km, expressways, bridges, tunnels, under construction, planned, completed, contractors, authorities); state brief (projects, contractors, corridors, upcoming signals) | Row → state filter + brief; print state briefing |
| D | **Corridor Explorer** | What does each corridor consist of? | Corridor cards: length, value, packages reported vs ingested, contractors, JV packages, status, completion, documented issues, states, endpoints | Project / company links |
| E | **Project Explorer** | Which projects match my criteria? | Sortable table; CSV/JSON export | Row → drawer |
| F | **Contractor Intelligence** | Who wins what, where, with whom? | Metric-sorted bars (label states metric) + table: projects, packages, attributed ₹, share-weighted ₹, km, active, done, bridges, tunnels, states, authorities, JV partners | Company → graph node |
| G | **Authority Intelligence** | What does each authority own? | Authority cards: projects, value, km, status mix, contractors, states | Authority → filter |
| H | **Tender Intelligence** | What was procured, when, to whom? | Awards by year (count, value — separate charts), package procurement table | Project / company links |
| I | **Opportunity Radar** | What will be procured next — with evidence? | Six columns: Tender expected · Tender issued · Recently awarded · Construction · Upcoming phase · Re-tender | Item → drawer |
| J | **Relationship Graph** | How are authorities, projects and companies connected? | Force-directed graph (authority ■, project ●, company ◆, JV dashed); side panel | Click company → projects, JVs, authorities, states, values, current vs completed |
| K | **Project Timeline** | How did each project evolve? | Per-project event glyphs on 2010–2029 axis, completion targets ⚑ | Hover → event, status, source |
| L | **Data Quality Centre** | How much can I trust this? | Metrics grid; per-record confidence score with 4 components and flags | Project → drawer |
| M | **Evidence Explorer** | What are the sources? | Tier distribution; source table with usage | Source → URL; project links |

## Project detail (drawer) — section order
Header (status, reference value, length, states, authority, contractors, record confidence, data-confidence score) → Project map → Summary → **Who built it?** (11 questions) → Contract structure tree + package table → Financials (all values, reference flagged, discrepancy note) → Timeline (append-only) with planned/revised/actual → Progress → Documented risks → Technology requirements (documented vs potential) → Opportunity signal → Stakeholders → Sources → Freshness. Printable as the **project briefing** PDF.

## Canonical example drill path

1. Map → click **Maharashtra** (state filter; KPIs, pipeline, feed recompute).
2. Status filter **Under construction** → Thane–Borivali Twin Tunnel, Pune Ring Road remain.
3. Click **Pune Outer Ring Road** → drawer → package table: PRR-W1 → **MEIL** (19 % on 19 Jan 2026, S031).
4. Click **MEIL** → graph view → MEIL's projects (Zojila, Thane–Borivali, Pune RR), authorities (NHIDCL, MMRDA, MSRDC), states.
5. Radar → *Re-tender / pending award*: PRR E5–E7 bids above estimate, not awarded as of Dec-2025 (S047).

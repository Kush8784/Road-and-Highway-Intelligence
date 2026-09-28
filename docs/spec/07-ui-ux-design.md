# 7 · UI/UX Design (incl. 9 Map · 10 Project Detail · 11 Contractor · 12 Tender · 13 Radar)

Working reference: the prototype in `dashboard/` implements every element below. Tokens and component rules: `docs/UI_CONTEXT.md`.

## Screen anatomy (desktop ≥ 1100 px)

```
┌ ◈ ITIS  [ Search project, contractor, JV, authority, state, corridor, tender… (/) ]   SAMPLE DATA · as of 2026-09-28  ◐ ┐
├ STATE[▾] TYPE[▾] STATUS[▾] AUTHORITY[▾] COMPANY[▾] VALUE≥[▾]  (chips ✕)  Clear                                    ┤
├ TOTAL 16 │ Σ REF ₹3.06 L cr │ UNDER CONSTR 2 │ COMPLETED 8 │ PLANNED 2 │ TENDERED 0 │ … │ TUNNELS 5 │ CONTRACTORS 16 ┤
├──────────┬─────────────────────────────────────────────────────────────┬───────────────────────────────────────┤
│ A·B Map  │  NATIONAL PROJECT MAP            [+][−][Reset]              │ LIFECYCLE PIPELINE                   │
│ C States │   (states, schematic project lines, glyph at midpoint)      │ PROPOSED ▭ 0  —   —                  │
│ D Corr.  │                                                             │ …                                    │
│ E Proj.  │                                                             │ CONSTRUCTION ▬▬ 6 1,67,765 2,325     │
│ F Contr. │  legend: ○ ◇ ◆ ▲ ◐ ✕ ‖ ● ⊘ (line style + glyph + colour)   │ LATEST DATED EVENTS                  │
│ …  M     │  footnote: geometry schematic; basemap licence              │ 2026-07-17 DAK — Punjab stretches…   │
└──────────┴─────────────────────────────────────────────────────────────┴───────────────────────────────────────┘
```
≤ 760 px: rail becomes a horizontal tab strip, map full-width, KPI strip scrolls horizontally, drawer full-screen.

## Interaction model
| Action | Result |
|---|---|
| Hover project | Tooltip: name, status, type, length, reference value, authority, contractors, geometry precision |
| Click state (map or table) | Toggle state filter → every view, KPI and chart recomputes |
| Click KPI | Applies its filter (status group / type / planned / awarded) or opens its view |
| Click legend item | Hide/show that status group on the map |
| Click project anywhere | Project drawer |
| Click company anywhere | Relationship graph centred on that company |
| Multi-filter | State × type × status × authority × company × value combine (AND) |
| `/`, ↑ ↓, Enter, Esc | Search focus, navigate results, open, close |
| Scroll / drag / ± | Map zoom (1–12×) and pan; labels appear at ≥ 1.3× |

Example flow (brief §44): click **Maharashtra** → Maharashtra projects → choose **MSRDC** → MSRDC projects in Maharashtra → click **Pune Outer Ring Road** → drawer → click **Navayuga** → all Navayuga projects.

## 9 · Map design
- **Base:** states (production: states + districts, Survey of India–compliant, LGD-coded). Selected state highlighted with accent outline; states with projects in the filter get a faint accent tint.
- **Lines** (expressways, corridors, packages, tunnels with approach roads): stroke colour by status group + distinct dash pattern + glyph at midpoint; expressways 3 px, others 2.5 px; 14 px invisible hit-line for hover.
- **Points** (bridges, tunnel portals, toll plazas, projects without alignment): glyph only.
- **Polygons** (production): influence areas, construction zones, industrial corridors — 10 % fill, hairline outline, below lines.
- **Precision is visible:** schematic geometry is labelled APPROXIMATE in tooltip and drawer; planned projects are dotted; production shows surveyed alignments solid and schematic ones with a lighter halo.
- **Scale:** at national zoom, cluster points > 50 per 40 px cell with a count; package lines render from zoom ≥ 7 (MapLibre) with corridor lines below.
- **Filters & time:** all global filters apply; a timeline slider (production) replays status by date from `project_events`.

## 10 · Project detail design (drawer)
Exactly as in the prototype for Atal Setu / MTHL:
1. **Header grid** — Status ● Operational (as of 2024-01) · Reference value ₹17,843 cr · Length 21.8 km · State · Authority MMRDA · Contractors (L&T, IHI, Daewoo E&C, Tata Projects) · Record confidence REPORTED · Data-confidence score.
2. **Project map** — schematic with endpoints; precision and basis printed on the map.
3. **Summary** — aliases, corridor/highway, programme, origin → destination, length basis, lanes, terrain, strategic importance, structures.
4. **Who built it?** — 11 questions; each answered with linked entities and sources, or *Not yet sourced*.
5. **Contract structure** — tree: Authority → Project → Package → JV → members (share, role) + package table with values, dates, status, progress, evidence.
6. **Financials** — every reported value with type, date, source, confidence; ✓ reference flag; discrepancy note.
7. **Timeline** — append-only events with precision and source; planned / revised / actual completion.
8. **Progress** — physical %, note, as-of.
9. **Risks** — documented causes by category with source; explicit "causes are never inferred".
10. **Technology requirements** — *Documented requirement* vs *Potential — inferred from characteristics*.
11. **Opportunity signal**, **Stakeholders** (public professional only), **Sources** (tier, publisher, date), **Freshness** (last verified / last source publication / last project update).
Actions: Briefing (print-to-PDF), close (Esc).

## 11 · Contractor intelligence
- Factual metrics only: projects, packages, attributed award value, share-weighted value (where JV share disclosed), package km, active and completed packages, bridge/tunnel projects, states, authorities, JV partners.
- Sort selector states the metric in words ("Sorted by: Attributed award value"); bars use one hue.
- Rule displayed on screen: JV package value counted in full per member unless share disclosed.
- Company click → graph panel: aliases, listing, HQ, parent, JV partners, authorities, states, current vs completed projects, consultants.
- Sample result: L&T — 3 projects / 4 packages / ₹17,187 cr attributed (MTHL Pkg 1 in consortium with IHI, Pkg 3 sole; Coastal Road Pkgs 1 & 4; Dwarka Pkg 4).

## 12 · Tender intelligence
- Awards by year — count and value as **two separate charts** (no dual axis).
- Package procurement table: project, package, authority, status, contractor/JV (with shares), value, km, award date, progress, evidence + confidence.
- Production adds: tender notice → bid → award funnel per authority, bidder counts, L1 margins, qualification criteria (turnover, similar work), cancellation/re-tender history, calendar of bid due dates.

## 13 · Opportunity Radar
Six columns, each with its analytical question; each item: project, status, authority, reference value, state, signal text, expected timing (**only if sourced**, otherwise "Not documented"), evidence link + tier, signal date, last verified, and technology needs tagged *potential* / *documented*.

Sample (2026-09-28):
| Column | Items |
|---|---|
| Tender expected | Shaktipeeth Expressway (cabinet approval 24 Jun 2025; revised alignment 2026; LA in progress) · Vadhavan–Samruddhi freight corridor (state cabinet approval 5 Aug 2025) |
| Tender issued | — none captured (empty state shown, not filled) |
| Recently awarded | Pune Outer Ring Road W1–W5 (2024) |
| Construction | Zojila Tunnel · Bengaluru–Chennai Expressway · Thane–Borivali Twin Tunnel |
| Upcoming phase | Ganga Expressway → Haridwar link (proposed; no procurement signal) |
| Re-tender / pending | Pune RR E5–E7 (bids above estimate, not awarded as of Dec-2025) · DAK Amritsar-spur (tender cancelled — land) |

## Accessibility
Status never colour-only (glyph + dash + label); WCAG AA text contrast on both themes; keyboard access to search, rail, drawer; forced-colours fallback; print stylesheet for briefings; Indian numbering with explicit units.

## Exports (brief §45)
Prototype: CSV (filtered projects, UTF-8 BOM for Excel), JSON (full dataset), print-to-PDF project/state briefing. Production: XLSX with one sheet per entity, server-rendered PDF briefings (project, contractor, state, tender) with source appendix.

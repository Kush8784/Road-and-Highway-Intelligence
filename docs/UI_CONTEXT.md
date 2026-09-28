# UI Context — design tokens & component conventions

**Character:** Bloomberg-terminal density + GIS map-first + research-terminal evidence. Dark by default, light supported. Minimal decoration, square-ish corners (3 px), hairline borders, no gradients, no animation beyond instant state change.

## Tokens (defined on `:root` in `dashboard/styles.css`)

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#0b0c0d` | `#f4f4f1` | page plane |
| `--surface-1/2/3` | `#121315 / #181a1d / #202327` | `#fcfcfb / #f6f6f3 / #ecebe6` | panels / inset / hover & tracks |
| `--line`, `--line-strong` | `#2a2d31`, `#3a3e44` | `#e1e0d9`, `#c3c2b7` | hairlines, axes |
| `--text-1/2/3` | `#f2f1ec / #c3c2b7 / #8d8b84` | `#0b0b0b / #52514e / #75736d` | primary / secondary / muted |
| `--accent` | `#3987e5` | `#2a78d6` | selection, focus, single-series bars |
| `--land`, `--land-hi`, `--land-line` | map fills & borders | | basemap |

**Typography:** IBM Plex Sans (UI) + IBM Plex Mono (IDs, numbers, dates), system fallbacks. 13 px base; panel titles 12 px uppercase tracked; KPI values 17 px mono. Tabular figures in tables. Indian number grouping (`en-IN`): ₹1,38,318 cr; ≥ ₹1 lakh crore shown as "₹3.06 L cr".

## Lifecycle status encoding (never colour alone)

| Group | Colour token | Glyph | Line dash | Statuses (of 28) |
|---|---|---|---|---|
| Proposed / Approved | `--st-proposed` | ○ | `2 5` dotted | Concept, Feasibility, DPR prep/done, Clearances, Approved, Tender expected, FC pending, Land acquisition |
| Tendered | `--st-tendered` | ◇ | `6 4` dashed | Tender issued, Bid evaluation, Re-tendered |
| Awarded | `--st-awarded` | ◆ | `10 3` | Awarded, LOA issued, Mobilization |
| Under construction | `--st-construction` | ▲ | solid | Under construction, Package-wise construction |
| Partially operational | `--st-partial` | ◐ | dash-dot | Partially operational |
| Delayed | `--st-delayed` | ✕ | `8 3 2 3` | Delayed |
| Stalled / Disputed | `--st-stalled` | ‖ | `2 3` | Stalled, Disputed |
| Completed / Operational | `--st-complete` | ● | solid | Substantially completed, Completed, Operational, Open to traffic |
| Cancelled / Terminated | `--st-cancelled` | ⊘ | `1 4` | Cancelled, Terminated, Unknown |

Groups are *display buckets only*; the record always shows its exact status label.

## Confidence encoding
`VERIFIED` green · `CROSS-VERIFIED` teal · `REPORTED` amber · `INFERRED` orange · `UNKNOWN` grey — always as an outlined mono tag with the word.

## Components
- **KPI tile:** label (10 px caps) / value (mono) / optional sub-line; clickable = applies a filter or opens a view; active tile gets a 2 px accent underline.
- **Filter bar:** one row of selects + removable chips; "Clear" resets all. Filters cross-apply to every view.
- **Panel:** `surface-1`, 1 px `--line`, 3 px radius, header = uppercase title + muted hint + right-aligned tools.
- **Table:** sticky header, hairline rows, numeric columns right-aligned mono, rows clickable when they open a record.
- **Bars:** single hue (`--bar`), 4 px rounded data end, value label at right; no multi-colour bars.
- **Drawer (project detail):** right slide-over, 760 px, printable as the project briefing.
- **Map:** SVG in prototype (MapLibre in production). Schematic geometry is labelled `APPROXIMATE`; planned lines are dotted; legend toggles groups.
- **Evidence link:** `S012 T3` — source ID linking to URL, followed by tier.

## Layout
Top bar (brand, global search `/`, sample flag, theme) → filter bar → KPI strip (horizontal scroll) → left rail (A–M views) + main. ≤ 760 px: rail becomes a horizontal tab strip; 16 px gutters; no horizontal page scroll.

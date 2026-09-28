# 4 · Data Sourcing Strategy & Ingestion Pipeline

## Source tiers

| Tier | Class | Examples | Use |
|---|---|---|---|
| **1 Official** | Government / authority | MoRTH, NHAI, NHIDCL, BRO, state PWDs & RDCs (MSRDC, UPEIDA, …), MMRDA, municipal corporations, PIB, Prasar Bharati (News On AIR), CPPP / eProcure / state e-procurement / GeM, Parliament Q&A (Lok Sabha / Rajya Sabha), budget documents, annual reports, PARIVESH (environment/forest clearances), land-acquisition gazette notifications (3A/3D under NH Act) | Verification of existence, status, cost, award |
| **2 Company** | Contractor & vendor disclosures | BSE/NSE announcements, order-book disclosures, annual reports, investor presentations, press releases, company project pages | Verification of award, value, JV, progress |
| **3 Publications** | Credible media & trade press | Business Standard, Economic Times Infra, The Hindu BusinessLine, Indian Express, Tribune, Construction World, Indian Infrastructure, ThePrint, Swarajya | Discovery + cross-verification |
| **4 Other** | Discovery | Wikipedia, project-tracker portals, blogs, social posts | Discovery only — never sole support for VERIFIED |

## Priority feeds (build order)

1. **PIB releases** (MoRTH, MoD for BRO) — daily; high-signal approvals, openings, costs.
2. **CPPP / eProcure + state portals** — tender notices, corrigenda, AOC (award of contract) results; tender IDs, bidders, values.
3. **Exchange filings** (BSE/NSE) for ~60 listed road/EPC companies — award announcements with value, authority, JV share.
4. **NHAI / MoRTH / state RDC project pages & annual reports** — package lists, progress.
5. **Parliament Q&A** — project-wise status and delay reasons (documented causes).
6. **PARIVESH & gazette LA notifications** — pre-construction signals (clearances, 3A/3D).
7. **Cabinet / CCEA decisions & state cabinet decisions** — approvals for Opportunity Radar.
8. **Trade press** — discovery sweep; every hit is followed to a Tier 1–2 source.

## Pipeline

```
SOURCE DISCOVERY → COLLECTION → DOCUMENT EXTRACTION → ENTITY EXTRACTION → NORMALISATION
  → DEDUPLICATION → ENTITY RESOLUTION → SOURCE VERIFICATION → GEOCODING → STATUS CLASSIFICATION
  → DATABASE → DASHBOARD
```

| Stage | How it operates | Output |
|---|---|---|
| **Source discovery** | Scheduled crawlers per feed (RSS/listing pages/API), keyword + entity watchlists (authorities, 300 companies, corridor names), research-agent search queries for gaps from DQ queue | Candidate URLs with first-seen time |
| **Collection** | Playwright/httpx fetch, robots-aware, per-domain rate limits; store raw HTML/PDF to object storage; `sha256`; archive snapshot URL | `sources`, `raw_documents` |
| **Document extraction** | HTML → main text; PDF → text layer, OCR fallback (Hindi + English), tables via Camelot; page anchors kept | Extracted text with page/offset map |
| **Entity extraction** | LLM with JSON-schema tool: projects, packages, values (with type), dates (with precision), companies, JV shares, statuses, delay causes, locations — each with **verbatim excerpt** | `claims` |
| **Normalisation** | Units (₹ lakh/crore/billion → ₹ cr), dates → ISO + precision, status phrases → 28-code taxonomy, state names → ISO codes, highway numbers → canonical format | Normalised claims |
| **Deduplication** | Same document (sha256), same URL (normalised), syndicated copies (near-duplicate text hash) collapse to one source; claims from syndicated copies don't count as independent | Deduped claims |
| **Entity resolution** | See below | Claims linked to canonical IDs |
| **Source verification** | Confidence assignment (see spec 06): Tier 1/2 → VERIFIED; ≥2 independent publishers → CROSS_VERIFIED; single Tier 3 → REPORTED; derived → INFERRED | Confidence per claim |
| **Geocoding** | Gazetteer (LGD villages/towns, OSM names) for endpoints; official alignment maps / KML where published; otherwise APPROXIMATE schematic with basis text | `project_locations` |
| **Status classification** | Latest dated, status-asserting event wins; conflicts (e.g. "opened" vs "delayed" same month) → `data_conflicts` | `project_events` |
| **Database** | Upserts to core tables only via resolved claims; events appended | Core tables |
| **Dashboard** | Read models refreshed; search index updated; change feed | UI |

## Deduplication of projects (brief §37)

Candidate generation: normalised alias match; trigram similarity > 0.6; shared highway number + overlapping states; geometry proximity (< 10 km endpoints).
Adjudication requires **evidence of identity** — same authority + same endpoints/length, or a source that names both forms. "Delhi Mumbai Expressway" ↔ "DME" ↔ "Delhi–Mumbai Greenfield Expressway" merge; "Mumbai Coastal Road (South)" and "Coastal Road North (Versova–Dahisar)" do **not** (different phases/authority contracts). Merge = `merged_into` tombstone + aliases moved; nothing deleted.

## Entity resolution (brief §38)

| Step | Companies | Authorities |
|---|---|---|
| 1 Deterministic | CIN / GSTIN / exchange code | Official short code |
| 2 Normalised alias | lower-case, strip punctuation, legal suffixes (Ltd, Limited, Pvt), `&`↔`and` | "NHAI" ↔ "National Highways Authority of India" |
| 3 Fuzzy candidates | trigram + embedding, same-country filter | |
| 4 Adjudication | LLM compares context (HQ, parent, sector) → match / no-match / uncertain | |
| 5 Analyst queue | uncertain cases | |

Parent/subsidiary are **not** merged (IRB Infrastructure Developers ≠ its SPVs; Adani Enterprises ≠ Adani Road Transport) — linked via `parent_company_id`. Original spelling always stored (`original_name_in_source`, aliases).

## Freshness (brief §39)
- Each project stores `last_verified`, latest source publication date, latest project update date.
- Active projects re-verified at least every 90 days; completed every 12 months.
- A status whose newest supporting source is > 12 months old is flagged **stale** and shown with its as-of date — never as current.
- New events append; historical statuses remain.

## Licensing & ethics
Respect robots.txt and terms; store excerpts not full-text redistribution for copyrighted press; attribute CC-BY data (DataMeet); no personal data beyond public professional roles.

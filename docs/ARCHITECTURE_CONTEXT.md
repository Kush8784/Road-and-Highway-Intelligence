# Architecture Context

## Target stack (production)

| Concern | Choice | Why |
|---|---|---|
| System of record | **PostgreSQL 16 + PostGIS 3** | Relational integrity for project→package→contract→party; native geometry; one store |
| Search | **OpenSearch** (or Postgres `pg_trgm` until >100k records) | Fuzzy multi-entity search, aliases, Hindi/transliterated names |
| Graph queries | Postgres recursive CTEs → **Apache AGE** extension if traversal needs grow | Avoid a second database until justified |
| API | **Python FastAPI** (typed Pydantic models generated from schema) | Same language as the pipeline; OpenAPI for the frontend |
| Frontend | **React + TypeScript + Vite**, **MapLibre GL JS** with self-hosted vector tiles (PMTiles), **deck.gl** for dense overlays, lightweight SVG/Canvas charts | Map-first, no tile vendor lock-in, fast at national scale |
| Pipeline orchestration | **Dagster** (or Prefect) | Asset lineage per source → claim → record |
| Crawling | **Playwright** + `httpx`; per-domain politeness; raw capture to object storage | Government portals are JS-heavy; captures are evidence |
| Document extraction | PDF text layer (`pdfplumber`) → OCR fallback (Tesseract / cloud OCR) → table extraction (Camelot) | Tender and DPR PDFs |
| Entity extraction & classification | **Claude** (latest Sonnet-class for bulk, Opus-class for adjudication) with JSON-schema tool outputs | Structured claims with excerpts, never free text |
| Entity resolution | Deterministic keys (CIN, GSTIN, tender ref) → normalised-alias match → trigram/embedding candidates → LLM adjudication → analyst queue | Precision over recall |
| RAG | pgvector over captured source text, citations required in every answer | Answers must cite `source_id`s |
| Object storage | S3-compatible (raw HTML/PDF, extracted text) | Immutable evidence |
| Auth | OIDC SSO; row-level access for the optional sales layer | Sales annotations are tenant-private |

## Prototype stack (this repo, today)

`dashboard/` is **static HTML + vanilla JS**, no build step, no runtime network dependency. Data is `window.ITIS_DATA` (`dashboard/data/sample-data.js`); the basemap is a simplified DataMeet state file (`dashboard/data/india-states.js`, CC BY 4.0). `tools/build-seed.js` turns the same data into `db/seed_sample.sql` so the schema and UI stay in lockstep.

## Component boundaries

```
 sources ─► raw_documents ─► claims ─► (resolution) ─► core tables ─► read models/views ─► API ─► UI
   ▲                                   │                    │
   └──── research agent ◄──── data_conflicts / DQ queue ◄───┘
```

- **Pipeline writes, UI reads.** The UI never writes core tables. Analyst corrections go through the same claim → resolution path.
- **Claims are the only way facts enter.** A core-table value without a claim/source is a bug.
- **Read models are derived.** `v_project_current_status`, contractor metrics, DQ scores are recomputable; never hand-edited.
- **Sales layer is separate.** Tenant annotations (targets, notes) live in their own schema and never mutate evidence tables.

## Invariants the stack must not break

1. `project_events` is append-only (DB trigger). Corrections are new events.
2. `source_id` is NOT NULL on every evidence-bearing table (tender, contract, party, value, event, risk, signal, participant, stakeholder).
3. JV members are separate `contract_parties` rows; consortium names are never parsed into one company.
4. At most one `is_reference` value per project, and it must carry `reference_reason`; all other values stay visible.
5. `project_participants.record_confidence` can never be `INFERRED`; inferred vendor needs live only in `technology_requirements(kind='potential')`.
6. Every geometry has a `precision`; `APPROXIMATE` renders visibly different (schematic label) and is never exported as surveyed.
7. Entities are merged via `merged_into` tombstones, never hard-deleted; aliases keep source spellings.
8. Map boundaries in production must be Survey of India–compliant.
9. No personal data beyond public professional roles in `stakeholders`.
10. Money is INR crore `numeric(14,2)`; no floats for money anywhere.

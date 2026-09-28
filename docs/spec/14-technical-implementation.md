# 14 · Technical Implementation

| Concern | Recommendation | Notes |
|---|---|---|
| **Frontend** | React 19 + TypeScript (strict) + Vite; TanStack Query for data; TanStack Table for grids; Zustand for the cross-filter store | The prototype's view IA (A–M) and filter model port 1:1 |
| **Map** | MapLibre GL JS + self-hosted PMTiles (Survey of India–compliant boundaries, OSM roads under ODbL where licensed); deck.gl for dense points/lines | No commercial tile dependency; works on intranet |
| **Charts** | Observable Plot or visx (SVG), single-hue by default; one question per chart | No dual axes |
| **Backend API** | Python 3.12 FastAPI; SQLAlchemy 2 core queries; Pydantic v2 models; OpenAPI → generated TS client | |
| **Database** | PostgreSQL 16 | `db/schema.sql` |
| **Geospatial** | PostGIS 3 (GiST indexes, `ST_Intersects` for state/district assignment, `ST_LineMerge` for package → corridor lines); tiles via `ST_AsMVT` or pre-built PMTiles | |
| **Search** | Phase 1: `pg_trgm` + `tsvector`; Phase 2: OpenSearch with alias synonyms, transliteration (Hindi ↔ English) and per-entity boosting | Index projects, aliases, companies, authorities, packages, tender refs, stakeholders |
| **Graph** | Recursive CTEs over `contract_parties`/`project_participants`; Apache AGE if multi-hop analytics grow | Graph UI via Sigma.js/Graphology for > 500 nodes |
| **ETL / orchestration** | Dagster software-defined assets: `sources → raw_documents → claims → resolved entities → core tables → read models` | Asset lineage = provenance |
| **Scraping** | Playwright (JS portals, CAPTCHA-free public pages only) + httpx; per-domain politeness; rotating schedule; raw capture to S3-compatible storage with sha256 and archive link | Respect robots/terms; no login-walled scraping |
| **Document extraction** | pdfplumber / PyMuPDF text; Tesseract (eng+hin) or cloud OCR fallback; Camelot for tables; page-anchored spans | Tender PDFs, DPR summaries, annual reports |
| **Entity extraction** | Claude (Sonnet-class) with tool/JSON-schema output; excerpts mandatory; temperature 0; prompt = spec 05 | Batch API for backfills |
| **Entity resolution** | Deterministic keys → normalised aliases → trigram + embedding candidates (pgvector) → LLM adjudication (Opus-class) → analyst queue; Splink as optional probabilistic linker | Precision-first thresholds |
| **LLM / RAG layer** | pgvector over chunked source text; retrieval scoped by entity; answer must cite `source_id`s; refuse when evidence absent | Analyst assistant: "Show me all tunnel projects under construction", "What changed on DME since award?" |
| **Data refresh** | Feed schedules: PIB hourly; tender portals 4×/day; exchange filings hourly; authority pages daily; press daily; re-verification queue per freshness SLA (spec 06) | Change events stream to UI "latest events" |
| **Quality gates** | Great Expectations / custom SQL checks per load (spec 06 rules) | Block vs warn |
| **Auth & tenancy** | OIDC SSO; Postgres RLS for tenant-private sales annotations | Evidence tables are global, read-only to users |
| **Observability** | OpenTelemetry traces per asset run; per-source success/lag dashboards; LLM cost & rejection-rate metrics | |
| **Deployment** | Containers on managed Kubernetes or ECS; managed Postgres with PostGIS; object storage; CDN for tiles & static app | |

## Refresh architecture

```
 schedulers ─► fetchers ─► raw store (S3) ─► extract ─► claims ─┬─► auto-resolve (high confidence) ─► core tables ─► read models ─► API/UI
                                                                └─► analyst queue ◄─ DQ engine (stale / conflict / low confidence)
                                                                             ▲
                                                research agent (spec 05) ────┘  (DEEPEN / REFRESH / SIGNALS tasks)
```

## Repository layout (target)

```
dashboard/        prototype (static)            → replaced by web/ in Phase 3
web/              React app
api/              FastAPI service
pipeline/         Dagster assets: fetchers/, extractors/, resolvers/, geocoders/
db/               schema.sql, migrations/, seed_sample.sql
tools/            build-seed.js, build-basemap.js
docs/             context docs + spec/
```

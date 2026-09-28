# Code Standards

## General
- Small, readable modules; one responsibility per file. Match surrounding style.
- Names say what the thing is in domain terms: `package`, `contract_party`, `reference_value`, not `item`, `row`, `val`.
- Comments explain *why* (a rule, a source quirk), not *what*.
- No silent fallbacks for missing facts: unknown is `null` / `NULL` and rendered as "Not captured" / "—".

## Data & SQL
- Schema changes are migrations (`db/migrations/NNNN_description.sql`) once production starts; `db/schema.sql` is the current snapshot.
- snake_case tables and columns; singular FK names (`project_id`), plural table names.
- Money `numeric(14,2)` INR crore; lengths `numeric(9,3)` km; dates `date` + `date_precision`.
- Every evidence table: `source_id NOT NULL REFERENCES sources`, `record_confidence confidence_level`.
- Enumerated vocabularies are `CHECK` lists or enums — add a value by migration, never free text.
- Never `UPDATE`/`DELETE` `project_events`. Never hard-delete projects/companies; use `merged_into`.
- Generated files (`db/seed_sample.sql`, `dashboard/data/india-states.js`) carry a GENERATED header and are rebuilt by `tools/`, never edited by hand.

## Pipeline (Python, production)
- Python 3.12, `ruff` + `mypy --strict`, Pydantic models for every extracted record.
- LLM outputs must validate against a JSON schema; invalid output is rejected, not repaired by guessing.
- Every extractor returns `Claim(entity, field, value, excerpt, source_id, confidence)`.
- Idempotent stages keyed by `sha256` of the raw document.

## Frontend
- Prototype: vanilla ES2020, no dependencies, `"use strict"` IIFE, helpers at top (`$`, `esc`, `fmt`).
- Production: React + TS strict; components named by view (`ProjectDrawer`, `RadarColumn`).
- **Escape all data** before inserting into HTML (`esc()` in the prototype).
- Colours only via CSS custom properties from `docs/UI_CONTEXT.md`; no hex in components.
- Status is always glyph + line style + colour + label — never colour alone.
- Numbers: `en-IN` grouping (lakh/crore), monospace tabular figures in tables.
- Every chart answers one stated question; no dual axes.

## Testing
- Schema: load `db/schema.sql` + `db/seed_sample.sql` into a scratch Postgres; must succeed with `ON_ERROR_STOP`.
- Data: `node tools/build-seed.js` must succeed; every `source` reference resolves (checked in CI script).
- UI: headless Chromium smoke test visits every view, opens a project drawer, runs a search, checks no console errors and no horizontal scroll at 390 px.

## Git
- Branch per change; conventional, imperative commit subjects ("Add tender_bids table").
- Data additions and code changes in separate commits where practical.

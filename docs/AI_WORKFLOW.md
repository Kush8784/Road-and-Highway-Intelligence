# AI Workflow — how agents work on ITIS

Two kinds of AI work happen here: **building the product** (coding agents) and **researching the data** (research agents). Both follow the same discipline: small scoped tasks, evidence before assertion, verify before claiming done.

## 1. Coding-agent loop

1. **Read context first:** `PROJECT_OVERVIEW` → `ARCHITECTURE_CONTEXT` (invariants) → `CODE_STANDARDS` → `UI_CONTEXT` → `PROJECT_TRACKER` (pick the next unblocked item).
2. **Scope one tracker item.** If it touches schema + pipeline + UI, split it.
3. **Plan in the tracker entry** (files, invariants at risk, test).
4. **Implement** the smallest change that satisfies the item.
5. **Verify:** schema loads, seed loads, UI smoke test passes, no console errors, 390 px has no horizontal scroll. Render and *look* at any UI change.
6. **Update `PROJECT_TRACKER.md`** (status, date, notes). Commit with a descriptive message.

Stop and ask a human when: an invariant would have to change; a data rule conflicts with a feature request; a source's licence is unclear; boundaries/cartography questions arise.

## 2. Research-agent loop (summary — full prompt in `docs/spec/05-research-agent-instructions.md`)

Discovery → primary-source verification → contractor verification → consultant verification → timeline reconstruction → geospatial verification → conflict resolution → final record with confidence.

Output is **claims**, never finished rows: `{entity, field, value, excerpt, source_url, pub_date, confidence}`. The resolution stage — not the agent — writes core tables.

## 3. Hard rules for every agent

| Rule | Consequence of breaking it |
|---|---|
| Never invent a project, contractor, value, date, status or coordinate | Record rejected; agent run flagged |
| Every claim carries a URL + excerpt + publication date | Claim dropped |
| Tier-4 sources discover; they do not verify | Claim capped at `REPORTED` |
| Old sources don't prove current status | Status older than 12 months marked stale |
| Conflicts are recorded, not resolved by preference | `data_conflicts` row opened |
| Inferred technology needs are `potential`, never participants | DB constraint rejects it |
| No personal data beyond public professional role | Stakeholder claim dropped |

## 4. Model use

| Task | Model class | Notes |
|---|---|---|
| Bulk extraction from notices/articles | Fast (Haiku/Sonnet-class) | JSON-schema tool output |
| Entity-resolution adjudication, conflict explanation | Strongest available (Opus-class) | Must cite both sources |
| Analyst Q&A (RAG) | Sonnet-class | Answers must cite `source_id`s; "not in evidence" is a valid answer |

## 5. Review gates
- New project records: auto-accept only when ≥1 Tier-1/2 source; otherwise analyst queue.
- Contractor attributions: require tender result, LOA/agreement, company filing, or authority release.
- Status changes to `CANCELLED`/`TERMINATED`/`DISPUTED`: always analyst-reviewed.

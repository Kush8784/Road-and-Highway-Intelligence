# 6 · Data Quality Framework

## Principles
- The score measures **confidence in the data**, never the quality of the project or contractor.
- Unknown stays unknown. Missing fields lower completeness; they are never imputed.
- Every conflict is visible and explained, or explicitly marked unresolved.

## Claim-level confidence
| Level | Rule |
|---|---|
| VERIFIED | Tier 1 or Tier 2 source states the fact |
| CROSS_VERIFIED | ≥ 2 independent publishers (syndication collapsed), ≥ 1 at Tier ≤ 3 |
| REPORTED | Single Tier 3 source, or any Tier 4 |
| INFERRED | Derived by rule (sum of sections, computed length); derivation stored |
| UNKNOWN | No evidence — field is NULL |

Record confidence = the confidence of the record's status claim, capped by the weakest of {existence, authority, status} claims.

## Record-level data-confidence score (0–100)

Implemented in the prototype (`dashboard/app.js › confidence()`), same formula planned as a materialised view.

| Component | Weight | Calculation |
|---|---|---|
| Source quality | 35 % | ½ × best tier among record sources (T1 = 1.0, T2 = 0.8, T3 = 0.6, T4 = 0.3) + ½ × record-confidence weight (VERIFIED 1.0, CROSS 0.9, REPORTED 0.6, INFERRED 0.35, UNKNOWN 0) |
| Independence | 20 % | min(1, (distinct publishers − 1) / 3) |
| Recency | 20 % | Age of newest status date or source publication: < 180 d = 1.0; < 365 d = 0.75; < 730 d = 0.5; older = 0.25 (coarse dates use mid-period) |
| Completeness | 25 % | Share of 6 key fields present: reference value, contractor (or none expected), geometry, completion date (planned/revised/actual), authority, length |

Example (sample): Atal Setu scores 61 — Tier 1 MMRDA source and 4 publishers, but status evidence is from Jan 2024 (recency 0.25) and record confidence is REPORTED.

## Data Quality Centre metrics
Total records · sources · records with ≥ 1 Tier-1 source · records needing verification · missing contractor · missing reference value · conflicting values · approximate coordinates · missing completion date · missing authority · stale records (> 365 d) · sources without publication date · last updated. Each links to the affected records.

## Validation rules (run on every load)

| Rule | Level |
|---|---|
| Every evidence row has a resolvable `source_id` | Block |
| Money ≥ 0 and < ₹5 lakh crore per project (sanity) | Block |
| `share_pct` of a contract's parties sums to ≤ 100 (= 100 when all disclosed) | Warn |
| Package lengths sum ≤ 1.1 × project length | Warn |
| Event dates not in the future beyond the as-of date (except targets) | Block |
| Actual completion ≥ award date | Warn |
| Geometry inside India bounding polygon; start/end within 25 km of named endpoints | Warn |
| Status `OPERATIONAL` with no opening/completion event | Warn |
| Participant with confidence INFERRED | Block (DB constraint) |
| Reference value without reason | Block (DB constraint) |
| Tier-4-only claim marked VERIFIED | Block |

## Conflict resolution (brief §14)
1. Store all values in `project_values` with type, date, source.
2. Classify the difference: initial vs revised estimate · tender estimate vs award · project vs package/contract · corridor vs section · incl./excl. land acquisition, O&M, GST · scope expansion · rounding/headline.
3. If explained → `discrepancy_note`, conflict `explained`; one value may be flagged `is_reference` with a reason.
4. If not → conflict stays `open`; no reference value; UI shows "Multiple publicly reported values exist; value requires further verification." (e.g. Shaktipeeth ₹86,300 cr vs ₹20,787 cr).

## Freshness SLAs
| Record state | Re-verify every |
|---|---|
| Tender issued / bid evaluation | 14 days |
| Under construction / delayed | 90 days |
| Pre-construction (approved, LA) | 120 days |
| Completed / operational | 12 months |

## Review workflow
DQ queue sorted by (value × staleness × low confidence). Analysts accept/reject claims; every decision is logged with user and time; rejected claims remain in `claims` with status for audit.

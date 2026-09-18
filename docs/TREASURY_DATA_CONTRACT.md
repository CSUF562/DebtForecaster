# Treasury Debt Observation Contract

## Purpose

This contract defines the first normalized fiscal record used by Project Enclave.

## Entity: DebtObservation

Required fields:

| Field | Type | Evidence class | Description |
|---|---|---|---|
| id | string | system | Stable Enclave observation ID |
| recordDate | ISO date | observed | Treasury record date |
| totalPublicDebtOutstanding | decimal string | observed | Total public debt outstanding |
| debtHeldByPublic | decimal string | observed | Debt held by the public |
| intragovernmentalHoldings | decimal string | observed | Intragovernmental holdings |
| sourceAgency | string | observed metadata | U.S. Department of the Treasury |
| sourceDataset | string | observed metadata | Dataset identifier/name |
| sourceRecordId | string/null | observed metadata | Upstream record identifier if supplied |
| retrievedAt | ISO timestamp | system | Time Enclave retrieved the observation |
| adapterVersion | string | system | Source adapter version |
| rawPayloadHash | string | system | Integrity hash of normalized raw source record |
| validationStatus | enum | derived | pass, warning, fail |
| validationNotes | string[] | derived | Validation findings |

## Precision

Currency values should be stored as decimal strings or fixed-precision numeric values. Do not use IEEE-754 floating point for authoritative dollar amounts.

## Validation

Minimum validation rules:

1. Required source fields exist.
2. Currency fields parse as non-negative decimal values.
3. Record date is valid.
4. The accounting identity is checked:

`totalPublicDebtOutstanding ≈ debtHeldByPublic + intragovernmentalHoldings`

5. Duplicate record dates are handled explicitly rather than silently overwritten.

## Immutability

A normalized observation is immutable after ingestion.

If Treasury revises a historical record, Enclave creates a new source-version record and preserves the earlier retrieved value for provenance.

## Derived trend records

Trend calculations must reference input observation IDs rather than copying source values without lineage.

Example derived fields:
- priorObservationId
- absoluteChange
- percentChange
- intervalDays

## Publication rule

A DebtObservation with `validationStatus = fail` must not become the public headline value automatically.

A warning may publish only when the warning is surfaced to the editorial/evidence layer.

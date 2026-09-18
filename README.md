# Project Enclave — DebtForecaster

Project Enclave is a U.S. fiscal-awareness and scenario-modeling application built around a simple public question:

> What is happening to the U.S. national debt, what does the accounting actually show, and what might different fiscal paths imply?

## Product structure

### Free public experience

The public home experience centers on the latest official U.S. Treasury national-debt figure and makes its movement understandable without overstating what can be inferred from daily accounting data.

Core free features:

- Latest official U.S. national debt
- Direction and recent trend
- Debt held by the public
- Intragovernmental holdings
- Historical context
- Daily “What Changed?” explanation
- Source and evidence provenance
- Overall Debt Path forecaster
- Annual Deficit Path forecaster

### Premium simulation experience

Premium functionality expands from awareness into scenario exploration:

- Component-level federal spending and revenue controls
- Advanced assumptions
- Saved and branching scenarios
- 1-, 5-, and 10-year modeled outcomes
- Economic and household-condition scenarios
- Social-structure scenarios with explicit uncertainty
- Sovereign fiscal-stress / crisis mechanics
- Exports and comparison views

## Evidence boundaries

Enclave distinguishes among:

1. **Observed accounting facts** — directly reported or calculable from authoritative fiscal data.
2. **Derived measures** — transparent calculations based on observed data.
3. **Contextual evidence** — economic, legislative, market, and international information relevant to interpretation.
4. **Modeled projections** — scenario outputs dependent on stated assumptions.
5. **Hypotheses / interpretive explanations** — plausible explanations that must never be presented as established accounting causes without evidence.

The application must never express greater certainty than the evidence permits.

## ERC13

ERC13 is Enclave’s internal evidence and editorial-governance protocol. Ordinary users should not have to walk through thirteen procedural gates; the system should use the framework internally to preserve provenance, calibration, contestability, and revision.

A governing design principle for the project is:

**Act when action is necessary, but never surrender the capacity to doubt the model that justified the action.**

Supporting principles:

- Preserve revisability.
- Preserve visible uncertainty.
- Preserve human agency.
- Separate observation from interpretation.
- Make model assumptions inspectable.
- Record revisions rather than silently replacing prior claims.

## Sovereign fiscal-crisis modeling

Enclave may model escalating sovereign fiscal stress through stages such as:

1. Fiscal stress
2. Loss of market confidence
3. Liquidity or debt-limit crisis
4. Technical default
5. Broader sovereign default
6. Emergency stabilization
7. Possible debt restructuring

The model must not imply that the United States has a conventional corporate-style bankruptcy process or that any single debt-to-GDP threshold automatically causes default.

## Initial technical direction

- Web application: Next.js + TypeScript
- Primary data source: official U.S. Treasury fiscal data
- Persistent data store: PostgreSQL
- Automated ingestion with provenance and freshness checks
- Explicit observed/derived/contextual/modeled data types
- Automated tests for accounting identities and evidence boundaries

## Immediate implementation order

1. Establish repository and architecture.
2. Implement Treasury ingestion and normalized debt observations.
3. Build trend calculations and stale-data/error handling.
4. Build the daily “What Changed?” evidence pipeline.
5. Add persistent historical storage and provenance.
6. Implement the public dashboard.
7. Implement the two free forecasters.
8. Add premium component-level simulation.
9. Add fiscal-crisis mechanics only after the base model is validated.

## Repository

Canonical repository: `CSUF562/DebtForecaster`

This repository is the authoritative codebase for Project Enclave.

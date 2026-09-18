# Enclave Architecture

## 1. System purpose

Enclave separates fiscal observation, explanation, and simulation into distinct layers so that an authoritative accounting fact cannot quietly mutate into an interpretation or forecast.

## 2. Core layers

### A. Source ingestion
Authoritative fiscal observations enter through source adapters.

Initial source family:
- U.S. Treasury Fiscal Data

Each ingestion record must retain:
- source agency
- source dataset
- source URL or dataset identifier
- observation date
- retrieval timestamp
- raw field names
- raw values
- normalized values
- adapter version
- ingestion status

### B. Normalized fiscal facts

Normalized observations are immutable records derived from authoritative source rows.

Initial debt fields:
- total_public_debt_outstanding
- debt_held_by_public
- intragovernmental_holdings
- record_date

Accounting identity checks should verify, within documented source precision:

total_public_debt_outstanding ≈ debt_held_by_public + intragovernmental_holdings

A failed identity check must be visible to the pipeline and must not be silently discarded.

### C. Derived measures

Derived measures may include:
- day-over-day change
- 7-day change
- 30-day change
- rolling direction
- percentage change
- recent extrema

Every derived value must identify:
- formula/version
- input observation IDs
- calculation timestamp

### D. Context layer

Contextual records include economic, legislative, market, and international events that may help users understand the fiscal environment.

Context must never be labeled as a direct accounting cause merely because it occurred near a debt change.

### E. Explanation layer

Daily explanations should distinguish:

- **Observed:** what Treasury accounting changed.
- **Derived:** what Enclave calculated from those observations.
- **Context:** independently documented events relevant to the same period.
- **Hypothesis:** plausible interpretation not established by the accounting record.

### F. Scenario engine

Forecasts and simulations operate on explicit assumptions and must remain isolated from observed-history records.

Every scenario output should retain:
- scenario ID
- baseline vintage
- model version
- assumptions
- horizon
- output type
- uncertainty designation

## 3. Evidence classification

Canonical evidence types:

`observed`
: Directly reported by an authoritative source.

`derived`
: Deterministic calculation from observed values.

`contextual`
: Relevant external evidence that does not establish accounting causation.

`modeled`
: Output of a forecasting or scenario model.

`hypothesis`
: Interpretive explanation whose causal status remains uncertain.

UI components must not collapse these types into one undifferentiated claim.

## 4. ERC13 integration

ERC13 functions as internal governance rather than a thirteen-step public questionnaire.

Every publishable daily explanation should eventually be able to answer:

1. What is the underlying observation?
2. Where did it come from?
3. Has the source changed or been revised?
4. What was calculated rather than observed?
5. Which claims are contextual rather than causal?
6. What uncertainty remains?
7. What evidence could revise the explanation?

Later ERC13 gates can extend this contract without changing the basic observed/derived/contextual/modeled/hypothesis separation.

## 5. Revision principle

Published interpretations are versioned.

If new evidence changes an explanation:
- preserve the original version,
- create a revised version,
- record why it changed,
- identify the evidence that caused the revision.

The system should never create false certainty by rewriting history invisibly.

## 6. Governing principle

**Act when action is necessary, but never surrender the capacity to doubt the model that justified the action.**

Operational consequences:
- assumptions remain inspectable,
- uncertainty remains visible,
- models remain contestable,
- users retain agency,
- no model output is promoted to observed fact.

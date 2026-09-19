# Contextual Evidence Policy

## Purpose

The Enclave daily brief may show events that help users understand the fiscal, economic, monetary, legislative, or market environment surrounding a Treasury debt observation.

Context is not causation.

An event's presence in the same time period does not establish that it caused a change in the federal debt.

## Initial authoritative source registry

The first approved primary-government source families are:

- U.S. Department of the Treasury / Fiscal Data
- Congressional Budget Office
- Board of Governors of the Federal Reserve System

Additional source families can be added only through an explicit registry change and tests.

## Ingestion rules

Every contextual record must include:

- event date
- title
- summary
- source name
- source URL
- source tier
- retrieval time
- confidence
- revision/supersession fields
- uncertainty note
- explicit causal-claim flag

A contextual record is not allowed to assert causation at ingestion time.

## Confidence

High confidence means the event itself is well established by the cited source. It does **not** mean Enclave has high confidence that the event caused a debt movement.

Those are separate propositions.

## ERC13 gates

Contextual evidence must pass:

- G1 — source lineage
- G2 — evidence classification
- G3 — causality boundary
- G4 — source quality
- G5 — uncertainty and revision handling

Future gates may address corroboration, competing explanations, materiality, editorial synthesis, and publication review.

## Revision behavior

Context records should be preserved when revised or superseded. Enclave should link revisions rather than silently replacing earlier records.

The governing principle remains:

**Act when action is necessary, but never surrender the capacity to doubt the model that justified the action.**


## Non-production case studies

Static context fixtures and dated case studies are development/test material only. They must not be injected into the public daily snapshot unless each item has been retrieved through a live, provenance-preserving source adapter during the current publication cycle.

Until live context adapters are enabled, production output should publish verified Treasury accounting, derived measures, and explicitly unresolved causal questions with an empty contextual-evidence set rather than filling the gap with static examples.

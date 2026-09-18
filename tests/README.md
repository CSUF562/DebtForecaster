# Test data policy

The JSON fixture in `tests/fixtures/debt-to-penny.json` contains **synthetic values** chosen only to test parsing, accounting-identity validation, ordering, and provenance behavior.

It is not a historical Treasury extract and must never be displayed to users as fiscal data.

Production and smoke-test code should retrieve authoritative records from the U.S. Treasury Fiscal Data **Debt to the Penny** API.

## Deterministic tests

```bash
npm install
npm test
```

Deterministic unit tests inject a fake `fetch` implementation and therefore do not require network access.

## Live smoke test

A live smoke test should verify only the source contract and validation path. It should not replace deterministic fixtures, because upstream availability and source revisions are outside the unit-test boundary.

import assert from "node:assert/strict";
import test from "node:test";
import {
  assembleDailyContext,
  type ContextWindow
} from "../src/context/contextAssembler.js";
import type { ContextEvidence } from "../src/context/contextEvidence.js";

const window: ContextWindow = {
  startDate: "2026-09-16",
  endDate: "2026-09-18"
};

function candidate(overrides: Partial<ContextEvidence> = {}): ContextEvidence {
  return {
    id: "ctx-1",
    eventDate: "2026-09-17",
    title: "Documented policy event",
    summary: "A documented event relevant to the fiscal environment.",
    sourceName: "Board of Governors of the Federal Reserve System",
    sourceUrl:
      "https://www.federalreserve.gov/newsevents/pressreleases/example.htm",
    sourceTier: "other",
    retrievedAt: "2026-09-18T20:00:00Z",
    confidence: "high",
    revisionOfId: null,
    supersededById: null,
    causalClaim: false,
    uncertaintyNote:
      "This event is relevant context but does not by itself establish causation.",
    ...overrides
  };
}

test("promotes registered authoritative sources to their registry tier", () => {
  const bundle = assembleDailyContext([candidate()], window);

  assert.equal(bundle.items.length, 1);
  assert.equal(bundle.items[0].sourceTier, "primary-government");
});

test("excludes candidates outside the selected date window", () => {
  const bundle = assembleDailyContext(
    [candidate({ eventDate: "2026-09-10" })],
    window
  );

  assert.equal(bundle.items.length, 0);
  assert.equal(bundle.rejected.length, 0);
});

test("rejects unregistered high-confidence sources", () => {
  const bundle = assembleDailyContext(
    [
      candidate({
        sourceUrl: "https://example.com/story",
        sourceTier: "other"
      })
    ],
    window
  );

  assert.equal(bundle.items.length, 0);
  assert.equal(bundle.rejected.length, 1);
});

test("context bundle explicitly preserves the non-causal boundary", () => {
  const bundle = assembleDailyContext([candidate()], window);

  assert.match(bundle.boundary, /not proof/);
});

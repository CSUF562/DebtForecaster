import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyContextSource,
  findRegisteredContextSource
} from "../src/context/sourceRegistry.js";

test("recognizes Treasury fiscal data as a primary government source", () => {
  assert.equal(
    classifyContextSource(
      "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/"
    ),
    "primary-government"
  );
});

test("recognizes CBO as a primary government source", () => {
  assert.equal(
    findRegisteredContextSource("https://www.cbo.gov/publication/62105")?.id,
    "cbo"
  );
});

test("recognizes Federal Reserve releases as primary government sources", () => {
  assert.equal(
    classifyContextSource(
      "https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm"
    ),
    "primary-government"
  );
});

test("unknown domains remain untrusted until explicitly classified", () => {
  assert.equal(
    classifyContextSource("https://example.com/fiscal-opinion"),
    "other"
  );
});

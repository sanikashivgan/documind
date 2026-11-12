import assert from "node:assert/strict";
import test from "node:test";
import { groundExtractiveClaims } from "./answer-grounding.ts";

const passages = [
  { id: 1, passage: "The sensor measures temperature every five seconds." },
];

test("rejects an unsupported claim even when it cites a valid source ID", () => {
  const answer = groundExtractiveClaims(
    [{ text: "The sensor measures humidity.", sourceId: 1 }],
    passages,
  );

  assert.deepEqual(answer, { supported: false });
});

test("accepts verbatim grounded claims and returns their source IDs", () => {
  const answer = groundExtractiveClaims(
    [
      {
        text: "The sensor measures temperature every five seconds.",
        sourceId: 1,
      },
    ],
    passages,
  );

  assert.deepEqual(answer, {
    supported: true,
    answer: "“The sensor measures temperature every five seconds.”",
    sourceIds: [1],
  });
});

test("rejects claims that cite an unknown passage", () => {
  const answer = groundExtractiveClaims(
    [{ text: "The sensor measures temperature.", sourceId: 2 }],
    passages,
  );

  assert.deepEqual(answer, { supported: false });
});

test("returns unsupported for an answer with no claims", () => {
  assert.deepEqual(groundExtractiveClaims([], passages), { supported: false });
});

test("returns unsupported when retrieval has no evidence for the question", () => {
  assert.deepEqual(groundExtractiveClaims([], []), { supported: false });
});

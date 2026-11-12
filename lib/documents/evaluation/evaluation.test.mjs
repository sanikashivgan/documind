import assert from "node:assert/strict";
import test from "node:test";
import { createDocumentChunks } from "../retrieval.ts";
import {
  categoryCounts,
  evaluationQuestions,
  expandedCategoryCounts,
  expandedEvaluationQuestions,
} from "./questions.mjs";
import {
  factSupport,
  runEvaluation,
  runExpandedEvaluation,
  summarizeEvaluation,
} from "./run-evaluation.mjs";
import { largeDocumentFixture } from "./fixture.mjs";

const previouslyPassingOriginalCaseIds = [
  "D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08",
  "P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08",
  "E01", "E02", "E03", "E04", "E05", "E06",
  "M01", "M02", "M05",
  "N01", "N02", "N03", "N04", "N05", "N06",
  "L01", "L03", "L04", "L05", "L06",
];

test("evaluation set has exactly 40 unique questions in the requested categories", () => {
  assert.equal(evaluationQuestions.length, 40);
  assert.equal(
    new Set(evaluationQuestions.map(({ id }) => id)).size,
    evaluationQuestions.length,
  );
  for (const [category, expectedCount] of Object.entries(categoryCounts)) {
    assert.equal(
      evaluationQuestions.filter((question) => question.category === category)
        .length,
      expectedCount,
    );
  }
});

test("every case declares expected facts, evidence, and answer/refusal behavior", () => {
  for (const question of evaluationQuestions) {
    assert.ok(question.id);
    assert.ok(question.question);
    assert.ok(question.category);
    assert.ok(Array.isArray(question.expectedAnswerFacts));
    assert.ok(Array.isArray(question.expectedEvidence));
    assert.ok(["answer", "refuse"].includes(question.behavior));
    for (const evidence of question.expectedEvidence) {
      assert.ok(evidence.text);
      assert.ok(evidence.section);
      assert.ok(Number.isInteger(evidence.page));
      const alternatives = evidence.alternatives ?? [evidence];
      assert.ok(alternatives.length > 0);
      for (const alternative of alternatives) {
        assert.ok(alternative.text);
        assert.ok(alternative.section);
        assert.ok(Number.isInteger(alternative.page));
        assert.ok(
          question.document
            .toLocaleLowerCase()
            .includes(alternative.text.toLocaleLowerCase()),
        );
      }
    }
  }
});

test("the original 40 questions remain identifiable in the expanded set", () => {
  assert.equal(expandedEvaluationQuestions.length, 49);
  assert.deepEqual(
    expandedEvaluationQuestions.slice(0, evaluationQuestions.length),
    evaluationQuestions,
  );
  assert.equal(
    new Set(expandedEvaluationQuestions.map(({ id }) => id)).size,
    expandedEvaluationQuestions.length,
  );
  for (const [category, expectedCount] of Object.entries(expandedCategoryCounts)) {
    assert.equal(
      expandedEvaluationQuestions.filter(({ category: actual }) => actual === category)
        .length,
      expectedCount,
    );
  }
  assert.ok(
    expandedEvaluationQuestions
      .filter(({ id }) => id.startsWith("X"))
      .every(({ category }) =>
        ["unseen-paraphrase", "large-document"].includes(category),
      ),
  );
});

test("LoRa evidence accepts both the component list and sampling workflow", () => {
  const radioCase = evaluationQuestions.find(({ id }) => id === "D04");
  assert.deepEqual(
    radioCase.expectedEvidence[0].alternatives.map(({ section }) => section),
    ["3. HARDWARE COMPONENTS", "4. SAMPLING WORKFLOW"],
  );
});

test("fact support normalizes SQLite, storage verbs, and local adverbs", () => {
  const passage = [
    { passage: "The controller writes each reading to local SQLite." },
  ];

  const result = factSupport(
    "SQLite stores the readings locally",
    passage,
  );
  assert.equal(result.supported, true);
  assert.equal(result.coverage, 1);
  assert.deepEqual(result.missingTokens, []);
});

test("fact support rejects claims with unsupported content despite term overlap", () => {
  const result = factSupport(
    "SQLite encrypts the readings locally",
    [{ passage: "The controller writes each reading to local SQLite." }],
  );

  assert.equal(result.coverage, 0.75);
  assert.equal(result.supported, false);
  assert.deepEqual(result.missingTokens, ["encrypt"]);
});

test("fact support still requires every stated number to be present", () => {
  const result = factSupport(
    "SQLite stores the readings locally for 30 days",
    [{ passage: "The controller writes each reading to local SQLite." }],
  );

  assert.equal(result.supported, false);
  assert.ok(result.missingTokens.includes("30"));
});

test("large fixtures place annotated evidence after realistic distractors", () => {
  const chunks = createDocumentChunks(largeDocumentFixture);
  const lateEvidence = chunks.find(
    ({ sectionTitle, pageNumber, text }) =>
      sectionTitle === "4. SAMPLING WORKFLOW" &&
      pageNumber === 248 &&
      text.includes("writes the reading to local SQLite"),
  );
  const lateTrial = chunks.find(
    ({ sectionTitle, pageNumber, text }) =>
      sectionTitle === "8. BENCH TRIAL" &&
      pageNumber === 249 &&
      text.includes("Median local write latency was 42 milliseconds"),
  );
  const distractor = chunks.find(
    ({ sectionTitle }) => sectionTitle === "1. AQUACULTURE SENSOR PILOT",
  );

  assert.ok(lateEvidence);
  assert.ok(lateTrial);
  assert.ok(distractor);
  assert.ok(chunks.indexOf(lateEvidence) > chunks.indexOf(distractor));
  assert.ok(chunks.indexOf(lateTrial) > chunks.indexOf(distractor));
  assert.ok(
    evaluationQuestions
      .filter(({ id }) => ["L02", "L04"].includes(id))
      .every(({ expectedEvidence }) =>
        expectedEvidence.every(({ page }) => page >= 248),
      ),
  );
});

test("original benchmark yields deterministic per-question outcomes and metrics", () => {
  const results = runEvaluation();
  assert.equal(results.length, 40);

  for (const result of results) {
    assert.ok(Array.isArray(result.failures));
    assert.ok(Array.isArray(result.passages));
    assert.ok(Array.isArray(result.context));
    assert.ok(Array.isArray(result.evidenceResults));
    assert.ok(Array.isArray(result.factResults));
  }

  const refusals = results.filter(
    ({ question }) => question.behavior === "refuse",
  );
  assert.equal(refusals.length, 6);
  assert.ok(refusals.every(({ failures }) => failures.length === 0));

  const answerableEvidence = results.filter(
    ({ question }) => question.behavior === "answer",
  );
  assert.equal(answerableEvidence.length, 34);
  assert.ok(
    answerableEvidence.every(({ failures }) => failures.length === 0),
    "all answerable cases should have supported evidence and answer facts",
  );

  const citationCases = results.filter(
    ({ question }) => question.citationRequired,
  );
  assert.equal(citationCases.length, 6);
  for (const { context } of citationCases) {
    assert.ok(context.every(({ sourceId, pageNumber }) =>
      Number.isInteger(sourceId) && Number.isInteger(pageNumber),
    ));
  }

  const radioResult = results.find(({ question }) => question.id === "D04");
  assert.ok(
    radioResult.evidenceResults[0].matchingPassageIndexes.some((rank) => {
      const passage = radioResult.passages[rank - 1];
      return passage.sectionTitle === "4. SAMPLING WORKFLOW";
    }),
    "either annotated LoRa passage should satisfy the evidence item",
  );

  const batteryResult = results.find(({ question }) => question.id === "D08");
  assert.ok(batteryResult.factResults.every(({ supported }) => supported));
  assert.ok(
    !batteryResult.passages.some(({ passage }) =>
      passage.includes(batteryResult.question.expectedAnswerFacts[0]),
    ),
    "answer facts should validate paraphrased support, not require exact quote equality",
  );

  const summary = summarizeEvaluation(results);
  assert.equal(summary.caseCount, 40);
  const resultsById = new Map(
    results.map(({ question, failures }) => [question.id, failures]),
  );
  for (const id of previouslyPassingOriginalCaseIds) {
    assert.deepEqual(resultsById.get(id), [], `${id} must remain passing`);
  }
  assert.ok(
    summary.irrelevantPassageRate <= 0.5,
    `irrelevant passage rate rose to ${summary.irrelevantPassageRate}`,
  );
  assert.ok(summary.top1EvidenceCount <= summary.top3EvidenceCount);
  assert.ok(summary.top3EvidenceCount <= summary.top6EvidenceCount);
  assert.equal(
    summary.relevantPassagesRetrieved + summary.irrelevantPassagesRetrieved,
    results.reduce((total, { passages }) => total + passages.length, 0),
  );
  assert.ok(summary.meanReciprocalRank >= 0 && summary.meanReciprocalRank <= 1);
});

test("expanded benchmark reports early/late multi-section coverage separately", () => {
  const results = runExpandedEvaluation();
  assert.equal(results.length, 49);
  const combinedCase = results.find(({ question }) => question.id === "X08");
  assert.equal(combinedCase.evidenceResults.length, 2);
  assert.deepEqual(
    combinedCase.question.expectedEvidence.map(({ page }) => page),
    [2, 249],
  );
  const summary = summarizeEvaluation(results);
  assert.equal(summary.caseCount, 49);
  assert.ok(summary.evidenceCount > 0);
  assert.ok(
    summary.irrelevantPassageRate <= 0.5,
    `irrelevant passage rate rose to ${summary.irrelevantPassageRate}`,
  );

  const resultsById = new Map(
    results.map((result) => [result.question.id, result]),
  );
  assert.ok(
    resultsById.get("L02").factResults.every(({ supported }) => supported),
    "L02 database terminology should be supported by its SQLite evidence",
  );
  const evidenceRankFor = (id, index) =>
    resultsById.get(id).evidenceResults[index].rank;
  assert.notEqual(evidenceRankFor("M03", 1), null);
  assert.notEqual(evidenceRankFor("M06", 0), null);
  assert.notEqual(evidenceRankFor("X07", 0), null);
  assert.ok(
    resultsById.get("X08").evidenceResults.every(({ rank }) => rank !== null),
  );
  assert.notEqual(evidenceRankFor("X09", 0), null);
});

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { groundExtractiveClaims } from "../answer-grounding.ts";
import {
  createAnswerContext,
  retrieveRelevantPassages,
} from "../retrieval.ts";
import {
  categoryCounts,
  evaluationQuestions,
  expandedCategoryCounts,
  expandedEvaluationQuestions,
} from "./questions.mjs";

const retrievalOptions = {
  maxResults: 6,
  maxPassageLength: 1_000,
  maxContextLength: 6_000,
};

const FACT_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "before", "by",
  "during", "for", "from", "in", "into", "is", "it", "of", "on", "or",
  "the", "their", "to", "was", "were", "what", "with",
]);

const FACT_TOKEN_FORMS = new Map([
  ["database", "database"],
  ["databases", "database"],
  ["locally", "local"],
  ["sqlite", "database"],
  ["reading", "reading"],
  ["readings", "reading"],
  ["store", "store"],
  ["stores", "store"],
  ["stored", "store"],
  ["storing", "store"],
  ["write", "store"],
  ["written", "store"],
  ["writes", "store"],
  ["writing", "store"],
  ["retains", "retain"],
  ["retained", "retain"],
  ["raises", "raise"],
  ["raised", "raise"],
  ["exceeds", "exceed"],
  ["exceeded", "exceed"],
  ["queued", "queue"],
  ["measured", "measure"],
  ["recorded", "record"],
  ["captured", "capture"],
  ["lasted", "last"],
]);

function factTokens(text) {
  return [
    ...new Set(
      (text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
        .filter((token) => !FACT_STOP_WORDS.has(token))
        .map((token) => {
          if (FACT_TOKEN_FORMS.has(token)) return FACT_TOKEN_FORMS.get(token);
          if (token.length > 4 && token.endsWith("ies")) {
            return `${token.slice(0, -3)}y`;
          }
          if (token.length > 4 && token.endsWith("ing")) {
            return token.slice(0, -3);
          }
          if (token.length > 4 && token.endsWith("ed")) {
            return token.slice(0, -2);
          }
          if (token.length > 3 && token.endsWith("s") && !token.endsWith("ss")) {
            return token.slice(0, -1);
          }
          return token;
        }),
    ),
  ];
}

function evidenceAlternatives(evidence) {
  return evidence.alternatives ?? [evidence];
}

function passageSupportsAlternative(passage, alternative) {
  return (
    passage.passage
      .toLocaleLowerCase()
      .includes(alternative.text.toLocaleLowerCase()) &&
    (alternative.page === undefined ||
      passage.pageNumber === alternative.page) &&
    (!alternative.section ||
      passage.sectionTitle?.includes(alternative.section))
  );
}

export function factSupport(fact, passages) {
  const expectedTokens = factTokens(fact);
  const expectedNumbers = expectedTokens.filter((token) => /\p{N}/u.test(token));
  const isDatabaseStorageClaim =
    expectedTokens.includes("database") &&
    expectedTokens.some((token) =>
      ["local", "reading", "store"].includes(token),
    );
  const minimumCoverage = isDatabaseStorageClaim
    ? 0.8
    : expectedTokens.length <= 2
      ? 0.5
      : 0.6;
  const candidates = passages.map(({ passage }) => {
    const retrievedTokens = new Set(factTokens(passage));
    const matchedTokens = expectedTokens.filter((token) =>
      retrievedTokens.has(token),
    );
    const coverage =
      expectedTokens.length === 0
        ? 0
        : matchedTokens.length / expectedTokens.length;
    return {
      matchedTokens,
      retrievedTokens,
      coverage,
      allNumbersPresent: expectedNumbers.every((token) =>
        retrievedTokens.has(token),
      ),
    };
  });
  const best = candidates.sort(
    (left, right) => right.coverage - left.coverage,
  )[0] ?? {
    matchedTokens: [],
    retrievedTokens: new Set(),
    coverage: 0,
    allNumbersPresent: false,
  };

  return {
    fact,
    matchedTokens: best.matchedTokens,
    missingTokens: expectedTokens.filter(
      (token) => !best.retrievedTokens.has(token),
    ),
    coverage: best.coverage,
    supported: best.allNumbersPresent && best.coverage >= minimumCoverage,
  };
}

function validateEvaluationSet(questions, expectedCounts) {
  const ids = new Set(questions.map(({ id }) => id));
  if (ids.size !== questions.length) {
    throw new Error("Evaluation question IDs must be unique.");
  }

  for (const [category, expectedCount] of Object.entries(expectedCounts)) {
    const actualCount = questions.filter(
      (question) => question.category === category,
    ).length;
    if (actualCount !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} ${category} cases; found ${actualCount}.`,
      );
    }
  }

  for (const question of questions) {
    if (!Array.isArray(question.expectedAnswerFacts) ||
      !Array.isArray(question.expectedEvidence)) {
      throw new Error(`${question.id} must define expected facts and evidence.`);
    }
    for (const evidence of question.expectedEvidence) {
      const alternatives = evidenceAlternatives(evidence);
      if (alternatives.length === 0) {
        throw new Error(`${question.id} has an evidence item with no alternatives.`);
      }
      for (const alternative of alternatives) {
        if (
          !alternative.text ||
          !alternative.section ||
          !Number.isInteger(alternative.page)
        ) {
          throw new Error(`${question.id} has incomplete evidence metadata.`);
        }
        if (
          !question.document
            .toLocaleLowerCase()
            .includes(alternative.text.toLocaleLowerCase())
        ) {
          throw new Error(
            `${question.id} evidence is not present in its document fixture: "${alternative.text}"`,
          );
        }
      }
    }
  }
}

function evaluateCase(question) {
  const passages = retrieveRelevantPassages(
    question.document,
    question.question,
    retrievalOptions,
  );
  const context = createAnswerContext(passages);
  const failures = [];

  if (question.behavior === "refuse") {
    if (passages.length > 0) {
      failures.push(`expected refusal but retrieved ${passages.length} passage(s)`);
    }
    return {
      question,
      passages,
      context,
      failures,
      evidenceResults: [],
      factResults: [],
      relevantPassageCount: 0,
    };
  }

  if (passages.length === 0) {
    failures.push("expected an answer but retrieved no evidence");
  }

  const evidenceResults = question.expectedEvidence.map((item) => {
    const alternatives = evidenceAlternatives(item);
    const matchingPassageIndexes = passages.flatMap((passage, index) =>
      alternatives.some((alternative) =>
        passageSupportsAlternative(passage, alternative),
      )
        ? [index + 1]
        : [],
    );
    const rank = matchingPassageIndexes[0] ?? null;
    const matchedAlternative =
      rank === null
        ? null
        : alternatives.find((alternative) =>
            passageSupportsAlternative(passages[rank - 1], alternative),
          );

    if (rank === null) {
      failures.push(
        `missing expected evidence: "${item.text}" (or an annotated alternative)`,
      );
    }
    const citedPassage =
      rank === null ? null : passages[rank - 1];
    if (
      citedPassage &&
      matchedAlternative &&
      !groundExtractiveClaims(
        [{ text: matchedAlternative.text, sourceId: citedPassage.id }],
        passages,
      ).supported
    ) {
      failures.push(`expected evidence is not supported by its source ID: "${item.text}"`);
    }

    return { item, matchingPassageIndexes, rank, matchedAlternative };
  });

  const factResults = question.expectedAnswerFacts.map((fact) =>
    factSupport(fact, passages),
  );
  for (const result of factResults) {
    if (!result.supported) {
      failures.push(
        `expected answer fact is not supported by retrieved passages: "${result.fact}" (${Math.round(result.coverage * 100)}% token coverage)`,
      );
    }
  }

  const contextBySourceId = new Map(
    context.map(({ sourceId, text, pageNumber, sectionTitle }) => [
      sourceId,
      { text, pageNumber, sectionTitle },
    ]),
  );
  const sourceIds = passages.map(({ id }) => id);
  if (
    sourceIds.some((id) => !Number.isInteger(id)) ||
    new Set(sourceIds).size !== sourceIds.length
  ) {
    failures.push("retrieved source IDs are missing or duplicated");
  }

  if (
    passages.some(({ id, passage, pageNumber, sectionTitle }) => {
      const source = contextBySourceId.get(id);
      return (
        !source ||
        source.text !== passage ||
        source.pageNumber !== pageNumber ||
        source.sectionTitle !== sectionTitle
      );
    })
  ) {
    failures.push("answer context does not preserve source IDs or metadata");
  }

  if (
    question.citationRequired &&
    evidenceResults.some(({ item, rank }) => {
      const matchingAlternative =
        rank === null
          ? null
          : evidenceAlternatives(item).find((alternative) =>
              passageSupportsAlternative(passages[rank - 1], alternative),
            );
      return (
        matchingAlternative === null ||
        matchingAlternative === undefined ||
        matchingAlternative.page !== question.expectedPage
      );
    })
  ) {
    failures.push("expected source citation/page reference was not preserved");
  }

  return {
    question,
    passages,
    context,
    failures,
    evidenceResults,
    factResults,
    relevantPassageCount: new Set(
      evidenceResults.flatMap(({ matchingPassageIndexes }) =>
        matchingPassageIndexes,
      ),
    ).size,
  };
}

export function runEvaluation(questions = evaluationQuestions) {
  validateEvaluationSet(
    questions,
    questions === evaluationQuestions ? categoryCounts : expandedCategoryCounts,
  );
  return questions.map(evaluateCase);
}

export function runExpandedEvaluation() {
  return runEvaluation(expandedEvaluationQuestions);
}

export function summarizeEvaluation(results) {
  const evidenceResults = results.flatMap(({ evidenceResults: items }) => items);
  const evidenceCount = evidenceResults.length;
  const countAtRank = (limit) =>
    evidenceResults.filter(
      ({ matchingPassageIndexes }) =>
        matchingPassageIndexes.some((rank) => rank <= limit),
    ).length;
  const allPassages = results.flatMap(({ passages }) => passages);
  const relevantPassageCount = results.reduce(
    (total, result) => total + result.relevantPassageCount,
    0,
  );
  const irrelevantPassageCount = allPassages.length - relevantPassageCount;
  const reciprocalRankTotal = evidenceResults.reduce(
    (total, { rank }) => total + (rank === null ? 0 : 1 / rank),
    0,
  );
  const factResults = results.flatMap(({ factResults: facts }) => facts);

  return {
    caseCount: results.length,
    passedCases: results.filter(({ failures }) => failures.length === 0).length,
    evidenceCount,
    top1EvidenceCount: countAtRank(1),
    top3EvidenceCount: countAtRank(3),
    top6EvidenceCount: countAtRank(6),
    meanReciprocalRank:
      evidenceCount === 0 ? 0 : reciprocalRankTotal / evidenceCount,
    relevantPassagesRetrieved: relevantPassageCount,
    irrelevantPassagesRetrieved: irrelevantPassageCount,
    irrelevantPassageRate:
      allPassages.length === 0 ? 0 : irrelevantPassageCount / allPassages.length,
    expectedFactCount: factResults.length,
    supportedFactCount: factResults.filter(({ supported }) => supported).length,
  };
}

function percentage(numerator, denominator) {
  return denominator === 0
    ? "n/a"
    : `${Math.round((numerator / denominator) * 100)}%`;
}

function printReport(title, results) {
  const summary = summarizeEvaluation(results);
  console.log(`\n${title}`);
  console.log(`Cases: ${summary.passedCases}/${summary.caseCount} passed`);
  console.log(
    `Evidence top 1: ${summary.top1EvidenceCount}/${summary.evidenceCount} (${percentage(summary.top1EvidenceCount, summary.evidenceCount)})`,
  );
  console.log(
    `Evidence top 3: ${summary.top3EvidenceCount}/${summary.evidenceCount} (${percentage(summary.top3EvidenceCount, summary.evidenceCount)})`,
  );
  console.log(
    `Evidence top 6: ${summary.top6EvidenceCount}/${summary.evidenceCount} (${percentage(summary.top6EvidenceCount, summary.evidenceCount)})`,
  );
  console.log(
    `Mean reciprocal rank (per expected evidence item): ${summary.meanReciprocalRank.toFixed(3)}`,
  );
  console.log(
    `Passages: ${summary.relevantPassagesRetrieved} relevant, ${summary.irrelevantPassagesRetrieved} irrelevant; irrelevant rate ${percentage(summary.irrelevantPassagesRetrieved, summary.relevantPassagesRetrieved + summary.irrelevantPassagesRetrieved)}`,
  );
  console.log(
    `Expected answer facts supported: ${summary.supportedFactCount}/${summary.expectedFactCount}`,
  );

  console.log("\nPer-question evidence coverage:");
  for (const result of results) {
    const { question, evidenceResults, passages, failures } = result;
    const found = evidenceResults.filter(({ rank }) => rank !== null).length;
    const evidenceRanks = evidenceResults.map(({ rank }) => rank ?? "-").join(",");
    const irrelevant = passages.length - result.relevantPassageCount;
    console.log(
      `  ${failures.length === 0 ? "PASS" : "FAIL"} ${question.id}: ${found}/${evidenceResults.length} evidence items; ranks [${evidenceRanks || "n/a"}]; ${result.relevantPassageCount} relevant/${irrelevant} irrelevant passage(s)`,
    );
    for (const failure of failures) console.log(`    - ${failure}`);
  }
  return summary;
}

export function printEvaluationReports() {
  console.log("DocuMind deterministic Q&A retrieval evaluation");
  console.log("Historical original baseline: 28/40 (70%)");
  const original = runEvaluation();
  const originalSummary = printReport("Original benchmark (40 cases)", original);
  const expanded = runExpandedEvaluation();
  const expandedSummary = printReport(
    `Expanded benchmark (${expanded.length} cases)`,
    expanded,
  );
  console.log(
    "\nScores evaluate retrieval and annotated answer-fact support; they do not measure live Gemini answer accuracy.",
  );
  return { originalSummary, expandedSummary };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { expandedSummary } = printEvaluationReports();
  if (expandedSummary.passedCases !== expandedSummary.caseCount) {
    process.exitCode = 1;
  }
}

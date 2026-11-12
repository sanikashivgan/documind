import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createAnswerContext,
  createDocumentChunks,
  retrieveRelevantPassages,
} from "./retrieval.ts";
import {
  evaluationQuestions,
  expandedEvaluationQuestions,
} from "./evaluation/questions.mjs";

const report = `[Page 1]
1. Introduction
This project uses a software stack with a web dashboard, database, and directory structure for development.

2. System Architecture
The system contains an application server and a software layer that organizes files and services.

[Page 4]
3. Project Objectives
The main aims of this project are to monitor environmental conditions, provide timely alerts, and make sensor data easy to review.

3.1 Hardware Components
The hardware components are an ESP32 microcontroller, a temperature sensor, a humidity sensor, and an alert buzzer.

3.2 Sensor Readings and Simulation
Temperature and humidity readings are simulated in the prototype because physical sensor readings are not yet connected.

4. System Working Principle
The controller reads temperature and humidity values, compares them with configured thresholds, and activates an alert when a value exceeds a threshold.

5. Limitations
The prototype has only been evaluated with simulated readings and has not been validated in a long-term field deployment.

6. Conclusion
The project demonstrates a sensor-monitoring workflow and identifies physical sensor integration as a next step.`;

const electronicsLab = `[Page 1]
AIM:
To design, implement, and document a C++ mini project titled Electronics Virtual Lab Assistant.

OBJECTIVES:
To demonstrate Object-Oriented paradigms including Encapsulation, Abstraction, Inheritance, and Polymorphism.

THEORY & CONCEPT:
Inheritance allows child calculator modules to inherit common UI properties and methods from an abstract base class (LabModule).

PROGRAM SOURCE CODE (C++ IMPLEMENTATION):
class Experiment {
public:
  virtual void calculate() = 0;
};

class OhmsLawExperiment : public Experiment {
};

class ResistorNetworkExperiment : public Experiment {
};

class LEDResistorExperiment : public Experiment {
};`;

const classPurposeDocument = `[Page 3]
OBJECTIVES:
The purpose of this project is to demonstrate object-oriented programming.

The purpose of this project is to model electrical experiments.

The purpose of this project is to support reusable educational workflows.

The purpose of this project is to separate presentation from calculation.

The purpose of this project is to demonstrate abstraction.

The purpose of this project is to demonstrate polymorphism.

The purpose of this project is to provide reusable experiments.

PROGRAM SOURCE CODE (C++ IMPLEMENTATION):
class Experiment {
public:
  virtual void calculate() = 0;
};

Experiment defines a shared abstract interface for concrete experiment classes.`;

const resistorComparisonDocument = `[Page 4]
// FEATURE 2: SERIES AND PARALLEL RESISTORS
const seriesResistance = calculateSeriesEquivalent(resistors);
const seriesCurrent = sourceVoltage / seriesResistance;

const parallelResistance = calculateParallelEquivalent(resistors);
const parallelCurrent = sourceVoltage / parallelResistance;`;

const extractedElectronicsCode = `[Page 2]
PROGRAM SOURCE CODE (C++ IMPLEMENTATION):
class Experiment {
public:
  virtual void calculate() = 0;
};

class OhmsLawExperiment : public Experiment {
};

class ResistorNetworkExperiment : public Experiment {
};

class LEDResistorExperiment : public Experiment {
};

// FEATURE 2: SERIES AND PARALLEL RESISTORS
const double seriesResistance = calculateSeriesEquivalent(resistors);
const double seriesCurrent = sourceVoltage / seriesResistance;
const double parallelResistance = calculateParallelEquivalent(resistors);
const double parallelCurrent = sourceVoltage / parallelResistance;`;

const cases = [
  ["What are the main aims of this project?", "3. Project Objectives"],
  ["What are the hardware components?", "3.1 Hardware Components"],
  ["Which sensor readings are simulated?", "3.2 Sensor Readings and Simulation"],
  ["What are the limitations?", "5. Limitations"],
  ["Explain the system working principle.", "4. System Working Principle"],
];

const retrievalRegressionCases = [
  ...evaluationQuestions.filter(({ id }) =>
    ["M03", "M04", "M06", "L02"].includes(id),
  ),
  ...expandedEvaluationQuestions.filter(({ id }) =>
    /^X0[1-9]$/u.test(id),
  ),
];

for (const questionCase of retrievalRegressionCases) {
  test(`retrieves all annotated evidence for ${questionCase.id}`, () => {
    const passages = retrieveRelevantPassages(
      questionCase.document,
      questionCase.question,
      {
        maxResults: 6,
        maxPassageLength: 1_000,
        maxContextLength: 6_000,
      },
    );

    for (const item of questionCase.expectedEvidence) {
      const alternatives = item.alternatives ?? [item];
      assert.ok(
        alternatives.some((alternative) =>
          passages.some(
            ({ passage, pageNumber, sectionTitle }) =>
              passage
                .toLocaleLowerCase()
                .includes(alternative.text.toLocaleLowerCase()) &&
              (alternative.page === undefined ||
                pageNumber === alternative.page) &&
              (!alternative.section ||
                sectionTitle?.includes(alternative.section)),
          ),
        ),
        `${questionCase.id} did not retrieve annotated evidence: ${item.text}`,
      );
    }

    if (["L02", "X07", "X08"].includes(questionCase.id)) {
      assert.ok(
        passages.every(
          ({ passage }) =>
            !/\b(?:unrelated|separate|another\s+team'?s)\b/iu.test(passage) ||
            !/\bRiverWatch\b/iu.test(passage),
        ),
        `${questionCase.id} should not retrieve an explicitly unrelated document`,
      );
    }
  });
}

for (const [question, expectedSection] of cases) {
  test(`retrieves ${expectedSection} for "${question}"`, () => {
    const passages = retrieveRelevantPassages(report, question, {
      maxResults: 3,
      maxPassageLength: 1_000,
      maxContextLength: 4_000,
    });

    assert.ok(passages.length > 0, "expected at least one relevant passage");
    assert.equal(passages[0].sectionTitle, expectedSection);
    assert.equal(passages[0].pageNumber, 4);
  });
}

test("does not select generic stack passages for project aims", () => {
  const passages = retrieveRelevantPassages(report, cases[0][0], {
    maxResults: 3,
    maxPassageLength: 1_000,
    maxContextLength: 4_000,
  });

  assert.ok(passages.every((passage) => passage.sectionTitle !== "1. Introduction"));
  assert.ok(passages.every((passage) => passage.sectionTitle !== "2. System Architecture"));
});

test("matches paraphrased questions to objective passages", () => {
  const passages = retrieveRelevantPassages(
    report,
    "What is this project trying to achieve?",
    {
      maxResults: 6,
      maxPassageLength: 1_000,
      maxContextLength: 6_000,
    },
  );

  assert.ok(passages.length > 0);
  assert.equal(passages[0].sectionTitle, "3. Project Objectives");
  assert.equal(passages[0].pageNumber, 4);
});

test("matches general objective questions to objective passages", () => {
  const passages = retrieveRelevantPassages(
    report,
    "What is the main purpose of this project?",
    {
      maxResults: 6,
      maxPassageLength: 1_000,
      maxContextLength: 6_000,
    },
  );

  assert.ok(passages.length > 0);
  assert.equal(passages[0].sectionTitle, "3. Project Objectives");
  assert.equal(passages[0].pageNumber, 4);
});

test("matches query keywords found in a section heading", () => {
  const passages = retrieveRelevantPassages(
    report,
    "Tell me about hardware",
    {
      maxResults: 6,
      maxPassageLength: 1_000,
      maxContextLength: 6_000,
    },
  );

  assert.ok(passages.length > 0);
  assert.equal(passages[0].sectionTitle, "3.1 Hardware Components");
  assert.equal(passages[0].pageNumber, 4);
});

test("keeps the simulated-readings intent for explicit simulation questions", () => {
  let diagnostic;
  const passages = retrieveRelevantPassages(
    report,
    "Which sensor readings are simulated?",
    {
      maxResults: 6,
      maxPassageLength: 1_000,
      maxContextLength: 6_000,
    },
    (details) => {
      diagnostic = details;
    },
  );

  assert.ok(diagnostic.activeIntents.includes("simulated-readings"));
  assert.equal(passages[0]?.sectionTitle, "3.2 Sensor Readings and Simulation");
});

test("generic readings questions do not activate the simulated-readings intent", () => {
  let diagnostic;
  const passages = retrieveRelevantPassages(
    report,
    "Where are the readings stored?",
    {
      maxResults: 6,
      maxPassageLength: 1_000,
      maxContextLength: 6_000,
    },
    (details) => {
      diagnostic = details;
    },
  );

  assert.ok(!diagnostic.activeIntents.includes("simulated-readings"));
  assert.ok(
    passages.every(
      ({ sectionTitle }) => sectionTitle !== "5. Limitations",
    ),
  );
});

test("sensor questions without simulation wording do not activate simulation intent", () => {
  let diagnostic;
  const passages = retrieveRelevantPassages(
    report,
    "Which sensor measures humidity?",
    {
      maxResults: 6,
      maxPassageLength: 1_000,
      maxContextLength: 6_000,
    },
    (details) => {
      diagnostic = details;
    },
  );

  assert.ok(!diagnostic.activeIntents.includes("simulated-readings"));
  assert.ok(
    passages.every(
      ({ sectionTitle }) => sectionTitle !== "5. Limitations",
    ),
  );
});

test("D03 and L02 SQLite questions do not select limitations as simulated readings", () => {
  for (const id of ["D03", "L02"]) {
    const question = evaluationQuestions.find((item) => item.id === id);
    assert.ok(question, `expected evaluation question ${id}`);
    let diagnostic;
    const passages = retrieveRelevantPassages(
      question.document,
      question.question,
      {
        maxResults: 6,
        maxPassageLength: 1_000,
        maxContextLength: 6_000,
      },
      (details) => {
        diagnostic = details;
      },
    );

    assert.ok(!diagnostic.activeIntents.includes("simulated-readings"));
    assert.ok(
      passages.every(
        ({ sectionTitle }) => sectionTitle !== "13. LIMITATIONS",
      ),
      `${id} must not return Limitations as simulation evidence`,
    );
  }
});

test("normalizes the targeted document vocabulary groups", () => {
  const cases = [
    [
      "Where are measurements kept locally?",
      "Measurements are kept in the local archive during maintenance.",
    ],
    [
      "Which database stores these records?",
      "SQLite stores these records until upload.",
    ],
    [
      "Where is the reading stored?",
      "The controller writes each reading to SQLite.",
    ],
    [
      "What does the node keep during outages?",
      "The node retains samples during outages.",
    ],
    [
      "What happens when the network is down?",
      "If the radio link is unavailable, the controller queues a summary.",
    ],
    [
      "At what point does cloudy water trigger the alert?",
      "A turbidity alert occurs when the sensor exceeds 45 NTU.",
    ],
    [
      "How is the optical instrument checked against known values?",
      "Calibration uses reference solutions to check the optical sensor.",
    ],
    [
      "What was the typical time to save one local measurement?",
      "Median local write latency was 42 milliseconds.",
    ],
  ];

  for (const [question, passage] of cases) {
    const results = retrieveRelevantPassages(
      `[Page 1]\n1. TEST EVIDENCE\n${passage}`,
      question,
      {
        maxResults: 6,
        maxPassageLength: 1_000,
        maxContextLength: 6_000,
      },
    );

    assert.ok(
      results.some(({ passage: result }) => result === passage),
      `expected vocabulary match for "${question}"`,
    );
  }
});

test("retrieves expected evidence for D03, L02, P02-P05, P07, and M02", () => {
  for (const id of ["D03", "L02", "P02", "P03", "P04", "P05", "P07", "M02"]) {
    const question = evaluationQuestions.find((item) => item.id === id);
    assert.ok(question, `expected evaluation question ${id}`);
    const passages = retrieveRelevantPassages(
      question.document,
      question.question,
      {
        maxResults: 6,
        maxPassageLength: 1_000,
        maxContextLength: 6_000,
      },
    );
    const evidenceFound = question.expectedEvidence.map((item) =>
      passages.some(({ passage, sectionTitle, pageNumber }) =>
        (item.alternatives ?? [item]).some(
          (alternative) =>
            passage
              .toLocaleLowerCase()
              .includes(alternative.text.toLocaleLowerCase()) &&
            pageNumber === alternative.page &&
            sectionTitle?.includes(alternative.section),
        ),
      ),
    );

    assert.ok(
      evidenceFound.every(Boolean),
      `${id} expected evidence was not fully retrieved: ${evidenceFound.map(Number).join("/")}`,
    );
  }
});

test("does not return passages for an unrelated question", () => {
  const passages = retrieveRelevantPassages(
    report,
    "What is the document's refund policy?",
    {
      maxResults: 6,
      maxPassageLength: 1_000,
      maxContextLength: 6_000,
    },
  );

  assert.deepEqual(passages, []);
});

test("returns no passages for empty extracted text", () => {
  const passages = retrieveRelevantPassages(
    " \n\t ",
    "What are the project objectives?",
    {
      maxResults: 6,
      maxPassageLength: 1_000,
      maxContextLength: 6_000,
    },
  );

  assert.deepEqual(passages, []);
});

test("normalizes classes to class for source-code retrieval", () => {
  const options = {
    maxResults: 6,
    maxPassageLength: 1_000,
    maxContextLength: 6_000,
  };
  const classQuery = retrieveRelevantPassages(
    electronicsLab,
    "Which class inherit from Experiment?",
    options,
  );
  const classesQuery = retrieveRelevantPassages(
    electronicsLab,
    "Which classes inherit from Experiment?",
    options,
  );

  assert.deepEqual(
    classesQuery.map(({ sectionTitle, passage }) => ({ sectionTitle, passage })),
    classQuery.map(({ sectionTitle, passage }) => ({ sectionTitle, passage })),
  );
  assert.ok(classesQuery.length >= 4);
  assert.ok(
    classesQuery.every(({ sectionTitle }) =>
      sectionTitle?.startsWith("PROGRAM SOURCE CODE"),
    ),
  );
});

test("retrieves the abstract base class and source declarations for Experiment", () => {
  const options = {
    maxResults: 6,
    maxPassageLength: 1_000,
    maxContextLength: 6_000,
  };
  const abstractBasePassages = retrieveRelevantPassages(
    electronicsLab,
    "What is the abstract base class?",
    options,
  );
  const inheritorPassages = retrieveRelevantPassages(
    electronicsLab,
    "Which classes inherit from Experiment?",
    options,
  );
  const sourceCodePassages = retrieveRelevantPassages(
    electronicsLab,
    "According to the PROGRAM SOURCE CODE section, what is the abstract base class and which classes inherit from it?",
    options,
  );
  const derivedDeclarations = [
    "class OhmsLawExperiment : public Experiment",
    "class ResistorNetworkExperiment : public Experiment",
    "class LEDResistorExperiment : public Experiment",
  ];

  assert.ok(
    abstractBasePassages.some(({ passage }) => passage.includes("LabModule")),
  );
  for (const passages of [inheritorPassages, sourceCodePassages]) {
    const retrievedText = passages.map(({ passage }) => passage).join("\n");
    assert.ok(
      derivedDeclarations.every((declaration) =>
        retrievedText.includes(declaration),
      ),
    );
    assert.ok(
      passages[0].sectionTitle?.startsWith("PROGRAM SOURCE CODE"),
      "source-code passages should rank ahead of unrelated sections",
    );
  }
});

test("retrieves the requested source-code abstract class without THEORY confusion", () => {
  const passages = retrieveRelevantPassages(
    electronicsLab,
    "According to the PROGRAM SOURCE CODE section, what is the abstract base class?",
    {
      maxResults: 6,
      maxPassageLength: 1_000,
      maxContextLength: 6_000,
    },
  );
  const declarationPassage = passages.find(
    ({ passage }) =>
      /\bclass\s+Experiment\b/u.test(passage) &&
      /\bvirtual\b[^;{}]*?\bcalculate\s*\([^)]*\)[^;{}]*?=\s*0\s*;/u.test(
        passage,
      ),
  );
  const citationIds = passages.map(({ id }) => id);

  assert.ok(declarationPassage, "expected the abstract class declaration in top 6");
  assert.ok(
    declarationPassage.sectionTitle?.includes("PROGRAM SOURCE CODE"),
  );
  assert.ok(
    !passages.some(
      ({ sectionTitle, passage }) =>
        sectionTitle?.includes("THEORY") && passage.includes("LabModule"),
    ),
    "theory's LabModule reference must not replace the source-code class",
  );
  assert.ok(citationIds.every(Number.isInteger));
  assert.equal(new Set(citationIds).size, citationIds.length);
  assert.ok(citationIds.includes(declarationPassage.id));
});

test("retrieves derived class declarations for source-code inheritance phrasing", () => {
  const passages = retrieveRelevantPassages(
    electronicsLab,
    "Explain how inheritance is implemented in the source code.",
    {
      maxResults: 6,
      maxPassageLength: 1_000,
      maxContextLength: 6_000,
    },
  );
  const derivedDeclarations = [
    "class Experiment",
    "class OhmsLawExperiment : public Experiment",
    "class ResistorNetworkExperiment : public Experiment",
    "class LEDResistorExperiment : public Experiment",
  ];
  const context = createAnswerContext(passages);
  const retrievedText = context.map(({ text }) => text).join("\n");
  const citationIds = context.map(({ sourceId }) => sourceId);

  assert.ok(
    derivedDeclarations.every((declaration) =>
      retrievedText.includes(declaration),
    ),
  );
  assert.ok(
    context.every(({ sectionTitle }) =>
      sectionTitle?.includes("PROGRAM SOURCE CODE"),
    ),
  );
  assert.ok(citationIds.every(Number.isInteger));
  assert.equal(new Set(citationIds).size, citationIds.length);
  assert.deepEqual(
    context.map(({ sourceId }) => sourceId),
    passages.map(({ id }) => id),
  );
});

test("prioritizes the named class and nearby explanation for class-purpose questions", () => {
  const passages = retrieveRelevantPassages(
    classPurposeDocument,
    "What is the purpose of the Experiment class?",
    {
      maxResults: 6,
      maxPassageLength: 1_000,
      maxContextLength: 6_000,
    },
  );
  const context = createAnswerContext(passages);
  const contextText = context.map(({ text }) => text).join("\n");
  const citationIds = context.map(({ sourceId }) => sourceId);

  assert.ok(
    /\bclass\s+Experiment\b/u.test(contextText),
    "expected the named class declaration",
  );
  assert.ok(
    /\bvirtual\b[^;{}]*?\bcalculate\s*\([^)]*\)[^;{}]*?=\s*0\s*;/u.test(
      contextText,
    ),
    "expected the abstract calculate declaration",
  );
  assert.ok(
    contextText.includes("Experiment defines a shared abstract interface"),
    "expected nearby explanation of the named class",
  );
  assert.ok(
    context[0].sectionTitle?.includes("PROGRAM SOURCE CODE") &&
      /\bclass\s+Experiment\b/u.test(context[0].text),
    "the named class declaration should rank ahead of unrelated objectives",
  );
  assert.ok(citationIds.every(Number.isInteger));
  assert.equal(new Set(citationIds).size, citationIds.length);
  assert.deepEqual(
    context.map(({ sourceId }) => sourceId),
    passages.map(({ id }) => id),
  );
});

test("retrieves split series and parallel evidence for comparison questions", () => {
  const passages = retrieveRelevantPassages(
    resistorComparisonDocument,
    "What is the difference between series and parallel resistor connections according to this document?",
    {
      maxResults: 6,
      maxPassageLength: 1_000,
      maxContextLength: 6_000,
    },
  );
  const context = createAnswerContext(passages);
  const retrievedText = context.map(({ text }) => text).join("\n");
  const citationIds = context.map(({ sourceId }) => sourceId);

  assert.match(retrievedText, /seriesResistance\s*=\s*calculateSeriesEquivalent/iu);
  assert.match(retrievedText, /seriesCurrent\s*=/u);
  assert.match(
    retrievedText,
    /parallelResistance\s*=\s*calculateParallelEquivalent/iu,
  );
  assert.match(retrievedText, /parallelCurrent\s*=/u);
  assert.ok(
    passages.some(({ passage }) =>
      passage.includes("seriesResistance") && passage.includes("seriesCurrent"),
    ),
  );
  assert.ok(
    passages.some(
      ({ passage }) =>
        passage.includes("parallelResistance") &&
        passage.includes("parallelCurrent"),
    ),
  );
  assert.ok(citationIds.every(Number.isInteger));
  assert.equal(new Set(citationIds).size, citationIds.length);
  assert.deepEqual(
    context.map(({ sourceId }) => sourceId),
    passages.map(({ id }) => id),
  );
});

test("covers every source inheritance declaration before ranked source passages", () => {
  const document = `[Page 2]
THEORY & CONCEPT:
The theory describes inheritance using a generic LabModule base class.

PROGRAM SOURCE CODE (C++ IMPLEMENTATION):
class Experiment {
public:
  virtual void calculate() = 0;
};

class OhmsLawExperiment : public Experiment {
};

class ResistorNetworkExperiment : public Experiment {
};

class LEDResistorExperiment : public Experiment {
};

const int unrelatedSourceDetail = 1;
const int anotherUnrelatedSourceDetail = 2;
const int aThirdUnrelatedSourceDetail = 3;`;
  const passages = retrieveRelevantPassages(
    document,
    "Explain how inheritance is implemented in the source code.",
    {
      maxResults: 6,
      maxPassageLength: 180,
      maxContextLength: 6_000,
    },
  );
  const context = createAnswerContext(passages);
  const text = context.map(({ text }) => text).join("\n");
  const declarations = [
    "class Experiment",
    "class OhmsLawExperiment : public Experiment",
    "class ResistorNetworkExperiment : public Experiment",
    "class LEDResistorExperiment : public Experiment",
  ];

  assert.ok(
    declarations.every((declaration) => text.includes(declaration)),
    "all source inheritance declarations should be covered",
  );
  assert.ok(
    context.every(({ sectionTitle }) =>
      sectionTitle?.includes("PROGRAM SOURCE CODE"),
    ),
    "the THEORY LabModule reference must not displace source implementation",
  );
  assert.ok(passages.length <= 6);
  assert.deepEqual(
    context.map(({ sourceId }) => sourceId),
    passages.map(({ id }) => id),
  );
});

test("covers series and parallel implementation chunks before repeated section candidates", () => {
  const document = `[Page 4]
// FEATURE 2: SERIES AND PARALLEL RESISTORS
const double seriesResistance = calculateSeriesEquivalent(resistors);
const double seriesCurrent = sourceVoltage / seriesResistance;
const double seriesVoltageDrop = calculateSeriesVoltageDrop(resistors);
const double parallelResistance = calculateParallelEquivalent(resistors);
const double parallelCurrent = sourceVoltage / parallelResistance;
const double parallelBranchCurrent = calculateParallelBranchCurrent(resistors);
const double extraSeriesValue = seriesResistance + 1;
const double extraParallelValue = parallelResistance + 1;

THEORY:
The document discusses resistor networks and their electrical behavior.`;
  const passages = retrieveRelevantPassages(
    document,
    "What is the difference between series and parallel resistor connections according to this document?",
    {
      maxResults: 6,
      maxPassageLength: 100,
      maxContextLength: 6_000,
    },
  );
  const context = createAnswerContext(passages);
  const text = context.map(({ text }) => text).join("\n");

  assert.match(text, /calculateSeriesEquivalent/iu);
  assert.match(text, /calculateParallelEquivalent/iu);
  assert.ok(
    passages.some(({ passage }) =>
      /(?:series(?:Resistance|Current|Voltage)|calculateSeries)/iu.test(
        passage,
      ),
    ),
    "series implementation evidence should be selected",
  );
  assert.ok(
    passages.some(({ passage }) =>
      /(?:parallel(?:Resistance|Current|BranchCurrent)|calculateParallel)/iu.test(
        passage,
      ),
    ),
    "parallel implementation evidence should be selected",
  );
  assert.ok(passages.length <= 6);
  assert.deepEqual(
    context.map(({ sourceId }) => sourceId),
    passages.map(({ id }) => id),
  );
});

test("keeps source declarations and implementation statements intact at chunk boundaries", () => {
  const declarations = [
    "class Experiment",
    "class OhmsLawExperiment : public Experiment",
    "class ResistorNetworkExperiment : public Experiment",
    "class LEDResistorExperiment : public Experiment",
  ];
  const implementationStatements = [
    "const double seriesResistance = calculateSeriesEquivalent(resistors);",
    "const double parallelResistance = calculateParallelEquivalent(resistors);",
  ];
  const nearBoundarySource = extractedElectronicsCode.replace(
    "class ResistorNetworkExperiment",
    `${"extra neutral ".repeat(4)}\nclass ResistorNetworkExperiment`,
  );
  const chunks = createDocumentChunks(nearBoundarySource, 120);
  const chunkText = chunks.map(({ text }) => text).join("\n");

  for (const declaration of declarations) {
    assert.ok(
      chunks.some(({ text }) => text.includes(declaration)),
      `expected an intact chunk containing ${declaration}`,
    );
  }
  for (const statement of implementationStatements) {
    assert.ok(
      chunks.some(({ text }) => text.includes(statement)),
      "expected an intact implementation statement",
    );
  }
  assert.ok(
    chunks.every(
      ({ pageNumber, sectionTitle }) =>
        pageNumber === 2 &&
        (sectionTitle === "PROGRAM SOURCE CODE (C++ IMPLEMENTATION):" ||
          sectionTitle === "// FEATURE 2: SERIES AND PARALLEL RESISTORS"),
    ),
    "chunking should preserve page and section metadata",
  );
  assert.equal(
    (chunkText.match(/class ResistorNetworkExperiment : public Experiment/gu) ??
      []).length,
    1,
  );
});

test("retrieval diagnostics expose candidate metadata without passage text", () => {
  const options = {
    maxResults: 6,
    maxPassageLength: 1_000,
    maxContextLength: 6_000,
  };
  const question = "Explain how inheritance is implemented in the source code.";
  const expectedPassages = retrieveRelevantPassages(
    electronicsLab,
    question,
    options,
  );
  let diagnostic;
  const actualPassages = retrieveRelevantPassages(
    electronicsLab,
    question,
    options,
    (details) => {
      diagnostic = details;
    },
  );

  assert.deepEqual(actualPassages, expectedPassages);
  assert.ok(diagnostic);
  assert.equal(diagnostic.chunkCount, createDocumentChunks(electronicsLab).length);
  assert.equal(diagnostic.selectedCount, actualPassages.length);
  assert.ok(diagnostic.activeIntents.includes("source-code-inheritance-phrase"));
  assert.ok(
    diagnostic.chunks.some(
      ({ relevanceFlags, selectedPosition }) =>
        relevanceFlags.hasOhmsLawDerivedDeclaration &&
        selectedPosition !== null,
    ),
  );
  assert.ok(
    diagnostic.chunks.every(
      ({ scoreBreakdown, chunkIndex, pageNumber, sectionTitle }) =>
        Number.isInteger(chunkIndex) &&
        (pageNumber === null || Number.isInteger(pageNumber)) &&
        typeof sectionTitle === "string" &&
        Object.values(scoreBreakdown).every(Number.isFinite),
    ),
  );
  assert.ok(
    diagnostic.chunks.every(
      (chunk) =>
        !Object.hasOwn(chunk, "text") && !Object.hasOwn(chunk, "passage"),
    ),
  );
});

test("Gemini prompt requires verbatim claims and rejects unsupported questions", async () => {
  const routeSource = await readFile(
    new URL("../../app/api/documents/[id]/answer/route.ts", import.meta.url),
    "utf8",
  );
  const promptInstructions = routeSource.slice(
    routeSource.indexOf("systemInstruction:"),
    routeSource.indexOf("contents:"),
  );

  assert.match(promptInstructions, /exact, verbatim quotations/u);
  assert.match(promptInstructions, /Do not paraphrase/u);
  assert.match(promptInstructions, /directly answer the user's question/u);
  assert.match(promptInstructions, /empty claims array/u);
});

test("respects the result and context bounds", () => {
  const passages = retrieveRelevantPassages(report, cases[0][0], {
    maxResults: 2,
    maxPassageLength: 180,
    maxContextLength: 220,
  });

  assert.ok(passages.length <= 2);
  assert.ok(passages.every((passage) => passage.passage.length <= 180));
  assert.ok(passages.reduce((total, passage) => total + passage.passage.length, 0) <= 220);
});

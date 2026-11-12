import { documentFixture, largeDocumentFixture } from "./fixture.mjs";

function answerCase(
  id,
  question,
  category,
  expectedAnswerFacts,
  expectedEvidence,
  options = {},
) {
  return {
    id,
    question,
    category,
    expectedAnswerFacts,
    expectedEvidence,
    expectedPage: options.expectedPage ?? null,
    behavior: "answer",
    document: options.document ?? (options.large ? largeDocumentFixture : documentFixture),
    citationRequired: options.citationRequired ?? false,
  };
}

function evidence(text, section, page) {
  return { text, section, page };
}

function evidenceWithAlternatives(text, section, page, alternatives = []) {
  return {
    ...evidence(text, section, page),
    alternatives: [
      evidence(text, section, page),
      ...alternatives,
    ],
  };
}

function refuseCase(id, question) {
  return {
    id,
    question,
    category: "missing-information",
    expectedAnswerFacts: [],
    expectedEvidence: [],
    expectedPage: null,
    behavior: "refuse",
    document: documentFixture,
    citationRequired: false,
  };
}

export const evaluationQuestions = [
  answerCase(
    "D01",
    "What are the goals of the RiverWatch prototype?",
    "direct",
    ["Detect sudden turbidity increases", "Preserve measurements during network outages", "Provide daily summaries to watershed volunteers"],
    [{ text: "detect sudden turbidity increases", section: "2. PROJECT GOALS", page: 1 }],
  ),
  answerCase(
    "D02",
    "How often does the controller sample the probes?",
    "direct",
    ["Every five minutes"],
    [{ text: "Every five minutes", section: "4. SAMPLING WORKFLOW", page: 1 }],
  ),
  answerCase(
    "D03",
    "Which database stores readings locally?",
    "direct",
    ["Local SQLite"],
    [{ text: "local SQLite", section: "4. SAMPLING WORKFLOW", page: 1 }],
  ),
  answerCase(
    "D04",
    "Which radio technology sends summaries?",
    "direct",
    ["LoRa radio"],
    [
      evidenceWithAlternatives("LoRa radio", "3. HARDWARE COMPONENTS", 1, [
        evidence(
          "queues a summary for LoRa transmission",
          "4. SAMPLING WORKFLOW",
          1,
        ),
      ]),
    ],
  ),
  answerCase(
    "D05",
    "What threshold triggers a turbidity alert?",
    "direct",
    ["A reading exceeding 45 NTU"],
    [{ text: "exceeds 45 NTU", section: "6. ALERT RULE", page: 2 }],
  ),
  answerCase(
    "D06",
    "How many reference solutions are used for calibration?",
    "direct",
    ["0 NTU and 100 NTU reference solutions"],
    [{ text: "0 NTU and 100 NTU reference solutions", section: "5. CALIBRATION PROCEDURE", page: 2 }],
  ),
  answerCase(
    "D07",
    "What percentage of scheduled readings were recorded?",
    "direct",
    ["98.2 percent"],
    [{ text: "98.2 percent of scheduled readings were recorded", section: "8. BENCH TRIAL", page: 3 }],
  ),
  answerCase(
    "D08",
    "How long did the battery last during the bench trial?",
    "direct",
    ["Six days at five-minute sampling intervals"],
    [{ text: "battery lasted six days", section: "10. BATTERY OBSERVATION", page: 3 }],
  ),
  answerCase(
    "P01",
    "How frequently are both probes read?",
    "paraphrased",
    ["Both probes are sampled every five minutes"],
    [{ text: "Every five minutes", section: "4. SAMPLING WORKFLOW", page: 1 }],
  ),
  answerCase(
    "P02",
    "Where are measurements kept when the network is down?",
    "paraphrased",
    ["Readings are retained in SQLite"],
    [{ text: "retains readings in SQLite", section: "7. NETWORK OUTAGE HANDLING", page: 2 }],
  ),
  answerCase(
    "P03",
    "At what point does the system flag cloudy water?",
    "paraphrased",
    ["A reading above 45 NTU raises an alert"],
    [{ text: "reading exceeds 45 NTU", section: "6. ALERT RULE", page: 2 }],
  ),
  answerCase(
    "P04",
    "Which instrument detects water cloudiness?",
    "paraphrased",
    ["An optical turbidity sensor"],
    [{ text: "optical turbidity sensor", section: "3. HARDWARE COMPONENTS", page: 1 }],
  ),
  answerCase(
    "P05",
    "How is the optical instrument checked against known values?",
    "paraphrased",
    ["Calibration uses 0 NTU and 100 NTU reference solutions"],
    [{ text: "0 NTU and 100 NTU reference solutions", section: "5. CALIBRATION PROCEDURE", page: 2 }],
  ),
  answerCase(
    "P06",
    "What does the node do after its radio connection returns?",
    "paraphrased",
    ["Queued summaries are retransmitted after reconnection"],
    [{ text: "queues summaries for retransmission after the connection returns", section: "7. NETWORK OUTAGE HANDLING", page: 2 }],
  ),
  answerCase(
    "P07",
    "What was the typical time to save one local measurement?",
    "paraphrased",
    ["Median local write latency was 42 milliseconds"],
    [{ text: "Median local write latency was 42 milliseconds", section: "8. BENCH TRIAL", page: 3 }],
  ),
  answerCase(
    "P08",
    "How many days of operation did the battery provide?",
    "paraphrased",
    ["The battery lasted six days"],
    [{ text: "battery lasted six days", section: "10. BATTERY OBSERVATION", page: 3 }],
  ),
  answerCase(
    "E01",
    "What was the median local write latency?",
    "evidence-citation",
    ["42 milliseconds"],
    [{ text: "Median local write latency was 42 milliseconds", section: "8. BENCH TRIAL", page: 3 }],
    { expectedPage: 3, citationRequired: true },
  ),
  answerCase(
    "E02",
    "Which two reference concentrations are named in the calibration procedure?",
    "evidence-citation",
    ["0 NTU", "100 NTU"],
    [{ text: "0 NTU and 100 NTU reference solutions", section: "5. CALIBRATION PROCEDURE", page: 2 }],
    { expectedPage: 2, citationRequired: true },
  ),
  answerCase(
    "E03",
    "What delivery success was measured at one kilometer on an open path?",
    "evidence-citation",
    ["91.0 percent"],
    [{ text: "LoRa delivery success was 91.0 percent at one kilometer on an open path", section: "9. RADIO DELIVERY RESULTS", page: 3 }],
    { expectedPage: 3, citationRequired: true },
  ),
  answerCase(
    "E04",
    "What fraction of scheduled readings was recorded during the 14-day trial?",
    "evidence-citation",
    ["98.2 percent"],
    [{ text: "98.2 percent of scheduled readings were recorded", section: "8. BENCH TRIAL", page: 3 }],
    { expectedPage: 3, citationRequired: true },
  ),
  answerCase(
    "E05",
    "What does the maintenance checklist ask operators to do to the sensor before calibration?",
    "evidence-citation",
    ["Rinse the optical sensor with clean water"],
    [{ text: "rinse the optical sensor with clean water", section: "11. MAINTENANCE CHECKLIST", page: 4 }],
    { expectedPage: 4, citationRequired: true },
  ),
  answerCase(
    "E06",
    "What coordinate precision is used in shared daily summaries?",
    "evidence-citation",
    ["Coordinates are rounded to a 100-meter grid"],
    [{ text: "Coordinates are rounded to a 100-meter grid", section: "12. PRIVACY AND DATA HANDLING", page: 4 }],
    { expectedPage: 4, citationRequired: true },
  ),
  answerCase(
    "M01",
    "What does the prototype detect, and how are daily findings shared?",
    "multi-section",
    ["It detects sudden turbidity increases", "It provides daily summaries to watershed volunteers"],
    [
      { text: "detect sudden turbidity increases", section: "2. PROJECT GOALS", page: 1 },
      { text: "provide daily summaries to watershed volunteers", section: "2. PROJECT GOALS", page: 1 },
    ],
  ),
  answerCase(
    "M02",
    "How are readings stored locally, and what happens if the radio link is unavailable?",
    "multi-section",
    ["Readings are written to SQLite", "Readings are retained and summaries queued for retransmission"],
    [
      { text: "writes the reading to local SQLite", section: "4. SAMPLING WORKFLOW", page: 1 },
      { text: "retains readings in SQLite", section: "7. NETWORK OUTAGE HANDLING", page: 2 },
    ],
  ),
  answerCase(
    "M03",
    "Which sensor is used to measure turbidity, and what concentration triggers an alert?",
    "multi-section",
    ["An optical turbidity sensor", "A reading over 45 NTU"],
    [
      { text: "optical turbidity sensor", section: "3. HARDWARE COMPONENTS", page: 1 },
      { text: "exceeds 45 NTU", section: "6. ALERT RULE", page: 2 },
    ],
  ),
  answerCase(
    "M04",
    "How often are measurements taken, and how long did the battery last at that interval?",
    "multi-section",
    ["Samples are taken every five minutes", "The battery lasted six days at five-minute sampling"],
    [
      { text: "Every five minutes", section: "4. SAMPLING WORKFLOW", page: 1 },
      { text: "battery lasted six days", section: "10. BATTERY OBSERVATION", page: 3 },
    ],
  ),
  answerCase(
    "M05",
    "What were the recorded-reading rate and median write latency in the bench trial?",
    "multi-section",
    ["98.2 percent of scheduled readings", "42 milliseconds median local write latency"],
    [
      { text: "98.2 percent of scheduled readings were recorded", section: "8. BENCH TRIAL", page: 3 },
      { text: "Median local write latency was 42 milliseconds", section: "8. BENCH TRIAL", page: 3 },
    ],
  ),
  answerCase(
    "M06",
    "Which environmental condition remains unvalidated, and what future trial is planned?",
    "multi-section",
    ["Winter field conditions are unvalidated", "A winter field trial is a next step"],
    [
      { text: "not been validated in winter field conditions", section: "13. LIMITATIONS", page: 4 },
      { text: "winter field trial", section: "14. NEXT STEPS", page: 4 },
    ],
  ),
  refuseCase("N01", "What was the total grant budget in euros?"),
  refuseCase("N02", "Who is the named principal investigator?"),
  refuseCase("N03", "Which encryption cipher protects archived packets?"),
  refuseCase("N04", "What chemical reagent neutralizes lead contamination?"),
  refuseCase("N05", "Which satellite provider delivered the observations?"),
  refuseCase("N06", "What is the installation contractor's phone number?"),
  answerCase(
    "L01",
    "What does the RiverWatch node preserve during network outages?",
    "large-document",
    ["Measurements are preserved during network outages"],
    [{ text: "preserve measurements during network outages", section: "2. PROJECT GOALS", page: 1 }],
    { large: true },
  ),
  answerCase(
    "L02",
    "Which local database stores the sensor readings?",
    "large-document",
    ["SQLite stores the readings locally"],
    [
      evidence(
        "local SQLite",
        "4. SAMPLING WORKFLOW",
        248,
      ),
    ],
    { large: true },
  ),
  answerCase(
    "L03",
    "Which reference solutions are used to calibrate the optical sensor?",
    "large-document",
    ["0 NTU and 100 NTU reference solutions"],
    [{ text: "0 NTU and 100 NTU reference solutions", section: "5. CALIBRATION PROCEDURE", page: 2 }],
    { large: true },
  ),
  answerCase(
    "L04",
    "What was the measured median local write latency?",
    "large-document",
    ["42 milliseconds"],
    [
      evidence(
        "Median local write latency was 42 milliseconds",
        "8. BENCH TRIAL",
        249,
      ),
    ],
    { large: true },
  ),
  answerCase(
    "L05",
    "How long did the 12-volt battery operate at five-minute sampling?",
    "large-document",
    ["Six days"],
    [{ text: "battery lasted six days", section: "10. BATTERY OBSERVATION", page: 3 }],
    { large: true },
  ),
  answerCase(
    "L06",
    "What LoRa delivery success was recorded at one kilometer on an open path?",
    "large-document",
    ["91.0 percent"],
    [{ text: "LoRa delivery success was 91.0 percent at one kilometer on an open path", section: "9. RADIO DELIVERY RESULTS", page: 3 }],
    { large: true },
  ),
];

export const categoryCounts = {
  direct: 8,
  paraphrased: 8,
  "evidence-citation": 6,
  "multi-section": 6,
  "missing-information": 6,
  "large-document": 6,
};

const expandedQuestions = [
  answerCase(
    "X01",
    "What piece of equipment measures how cloudy the stream is?",
    "unseen-paraphrase",
    ["An optical turbidity sensor"],
    [evidence("optical turbidity sensor", "3. HARDWARE COMPONENTS", 1)],
  ),
  answerCase(
    "X02",
    "At what turbidity reading is an alarm raised?",
    "unseen-paraphrase",
    ["A reading over 45 NTU"],
    [evidence("reading exceeds 45 NTU", "6. ALERT RULE", 2)],
  ),
  answerCase(
    "X03",
    "How long did a local write typically take in the bench run?",
    "unseen-paraphrase",
    ["Median local write latency was 42 milliseconds"],
    [
      evidence(
        "Median local write latency was 42 milliseconds",
        "8. BENCH TRIAL",
        3,
      ),
    ],
  ),
  answerCase(
    "X04",
    "Where does the node keep samples while its radio is offline?",
    "unseen-paraphrase",
    ["Readings are retained in SQLite"],
    [evidence("retains readings in SQLite", "7. NETWORK OUTAGE HANDLING", 2)],
  ),
  answerCase(
    "X05",
    "Which wireless link carries queued summaries?",
    "unseen-paraphrase",
    ["LoRa transmits queued summaries"],
    [
      evidenceWithAlternatives("LoRa radio", "3. HARDWARE COMPONENTS", 1, [
        evidence(
          "queues a summary for LoRa transmission",
          "4. SAMPLING WORKFLOW",
          1,
        ),
      ]),
    ],
  ),
  answerCase(
    "X06",
    "How precisely are locations represented in the shared daily reports?",
    "unseen-paraphrase",
    ["Coordinates are rounded to a 100-meter grid"],
    [
      evidence(
        "Coordinates are rounded to a 100-meter grid",
        "12. PRIVACY AND DATA HANDLING",
        4,
      ),
    ],
  ),
  answerCase(
    "X07",
    "Which storage engine receives a reading from the controller?",
    "large-document",
    ["The controller writes each reading to local SQLite"],
    [
      evidence(
        "writes the reading to local SQLite",
        "4. SAMPLING WORKFLOW",
        248,
      ),
    ],
    { large: true },
  ),
  answerCase(
    "X08",
    "When the radio link fails, what is retained, and what median write latency was measured?",
    "large-document",
    [
      "Readings are retained in SQLite",
      "Median local write latency was 42 milliseconds",
    ],
    [
      evidence("retains readings in SQLite", "7. NETWORK OUTAGE HANDLING", 2),
      evidence(
        "Median local write latency was 42 milliseconds",
        "8. BENCH TRIAL",
        249,
      ),
    ],
    { large: true },
  ),
  answerCase(
    "X09",
    "What was the sampling interval, and what fraction of readings was captured in the trial?",
    "large-document",
    ["Samples are taken every five minutes", "98.2 percent of scheduled readings were recorded"],
    [
      evidence("Every five minutes", "4. SAMPLING WORKFLOW", 248),
      evidence(
        "98.2 percent of scheduled readings were recorded",
        "8. BENCH TRIAL",
        249,
      ),
    ],
    { large: true },
  ),
];

export const expandedEvaluationQuestions = [
  ...evaluationQuestions,
  ...expandedQuestions,
];

export const expandedCategoryCounts = {
  ...categoryCounts,
  "unseen-paraphrase": 6,
  "large-document": 9,
};

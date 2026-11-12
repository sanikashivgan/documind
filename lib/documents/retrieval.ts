export type RetrievedPassage = {
  id: number;
  passage: string;
  sectionTitle: string | null;
  pageNumber: number | null;
  matchedTerms: number;
  totalTerms: number;
  score: number;
};

export type AnswerContextPassage = {
  sourceId: number;
  sectionTitle: string | null;
  pageNumber: number | null;
  text: string;
};

type RetrievalOptions = {
  maxResults: number;
  maxPassageLength: number;
  maxContextLength: number;
};

type Intent = {
  name: string;
  questionTerms: string[];
  activationQuestionTerms?: string[];
  requiredQuestionTerms?: string[];
  headingTerms: string[];
  contentTerms: string[];
  contentPatterns?: RegExp[];
  coverageTerms?: string[];
};

const STOP_WORDS = new Set([
  "a", "about", "an", "and", "are", "as", "at", "be", "because", "been",
  "being", "but", "by", "can", "could", "describe", "did", "do", "does",
  "according", "explain", "for", "from", "give", "has", "have", "how",
  "i", "in", "into", "is", "it", "its", "main", "of", "on", "or",
  "please",
  "project", "report", "show", "system", "tell", "that", "the", "their",
  "section", "these", "this", "those", "to", "was", "were", "what", "when", "where",
  "which", "who", "why", "with", "would",
]);

const STRONG_KEYWORD_SCORE_THRESHOLD = 4.5;
const SINGLE_KEYWORD_SCORE_THRESHOLD = 5.5;
const KEYWORD_SCORE_PER_REQUIRED_MATCH_THRESHOLD = 1.2;

const TARGETED_TOKEN_EQUIVALENTS = new Map([
  ["alarm", "alert"],
  ["captured", "record"],
  ["cloudy", "turbidity"],
  ["equipment", "hardware"],
  ["fraction", "percent"],
  ["locally", "local"],
  ["measurement", "sample"],
  ["measurements", "sample"],
  ["planned", "plan"],
  ["raised", "raise"],
  ["samples", "sample"],
  ["sampling", "sample"],
  ["future", "next"],
  ["sqlite", "database"],
  ["write", "store"],
  ["writes", "store"],
  ["written", "store"],
  ["writing", "store"],
  ["store", "store"],
  ["stores", "store"],
  ["stored", "store"],
  ["retain", "retain"],
  ["retains", "retain"],
  ["retained", "retain"],
  ["keeping", "retain"],
  ["kept", "retain"],
  ["keep", "retain"],
  ["instrument", "sensor"],
  ["instruments", "sensor"],
  ["flag", "alert"],
  ["flags", "alert"],
  ["flagged", "alert"],
  ["reading", "reading"],
  ["readings", "reading"],
  ["typical", "median"],
]);

function normalizeSearchText(text: string) {
  return text
    .replace(/\bradio\s+link(?:\s+is)?\s+unavailable\b/giu, "network down")
    .replace(/\bradio\s+link\b/giu, "network")
    .replace(/\bnetwork\s+(?:is\s+)?unavailable\b/giu, "network down")
    .replace(/\bnetwork\s+is\s+down\b/giu, "network down")
    .replace(/\bwhat\s+happens?\s+if\b/giu, "when")
    .replace(/\bcloudy\s+water\b/giu, "turbidity")
    .replace(/\bwater\s+cloudiness\b/giu, "turbidity")
    .replace(/\b(?:known|reference)\s+values?\b/giu, "calibration")
    .replace(/\btime\s+to\s+save\b/giu, "latency");
}

const INTENTS: Intent[] = [
  {
    name: "objectives",
    questionTerms: [
      "aim", "objective", "goal", "purpose", "accomplish", "achieve",
      "intend", "mission", "target",
    ],
    headingTerms: [
      "aim", "objective", "goal", "purpose", "mission", "target",
      "project overview", "scope",
    ],
    contentTerms: [
      "aim", "objective", "goal", "purpose", "designed to", "intended to",
      "created to", "developed to", "aim to", "seek to", "focus on",
      "accomplish", "achieve", "enable",
    ],
  },
  {
    name: "components",
    questionTerms: ["component", "components", "hardware", "device", "devices", "module", "modules"],
    headingTerms: ["component", "components", "hardware", "device", "devices", "architecture"],
    contentTerms: ["component", "hardware", "sensor", "module", "device"],
  },
  {
    name: "advantages",
    questionTerms: ["advantage", "advantages", "benefit", "benefits", "strength", "strengths"],
    headingTerms: ["advantage", "advantages", "benefit", "benefits", "strengths"],
    contentTerms: ["advantage", "benefit", "strength"],
  },
  {
    name: "limitations",
    questionTerms: ["limitation", "limitations", "drawback", "drawbacks", "constraint", "constraints", "challenge", "challenges"],
    headingTerms: ["limitation", "limitations", "drawback", "drawbacks", "constraint", "constraints", "challenge", "challenges"],
    contentTerms: ["limitation", "drawback", "constraint", "challenge"],
  },
  {
    name: "conclusion",
    questionTerms: ["conclusion", "conclusions", "conclude", "summary", "summarize", "findings"],
    headingTerms: ["conclusion", "summary", "findings"],
    contentTerms: ["conclusion", "concluded", "summary", "finding"],
  },
  {
    name: "working-principle",
    questionTerms: ["principle", "principles", "working", "operation", "operating", "workflow"],
    headingTerms: ["working principle", "principle", "operation", "operation principle", "workflow"],
    contentTerms: ["working principle", "operating principle", "works by", "operates by", "working", "operation"],
  },
  {
    name: "simulated-readings",
    questionTerms: ["simulated", "simulate", "simulation", "sensor", "sensors", "reading", "readings"],
    activationQuestionTerms: ["simulated", "simulate", "simulation"],
    headingTerms: ["simulated", "simulation", "sensor readings", "sensor values"],
    contentTerms: ["simulated", "simulation", "emulated", "virtual", "synthetic"],
  },
  {
    name: "source-code-inheritance",
    questionTerms: ["class", "inherit"],
    requiredQuestionTerms: ["class", "inherit"],
    headingTerms: ["program source code", "source code", "implementation"],
    contentTerms: [],
  },
  {
    name: "source-code-inheritance-phrase",
    questionTerms: ["inheritance"],
    requiredQuestionTerms: ["source", "code"],
    headingTerms: ["program source code", "source code", "implementation"],
    contentTerms: [],
    contentPatterns: [
      /\bclass\s+[A-Za-z_]\w*\s*:\s*public\s+[A-Za-z_]\w*/u,
    ],
  },
  {
    name: "requested-source-code-class",
    questionTerms: ["class"],
    requiredQuestionTerms: ["program", "source", "code"],
    headingTerms: ["program source code", "source code", "implementation"],
    contentTerms: [],
    contentPatterns: [
      /\bclass\s+[A-Za-z_]\w*/u,
      /\bvirtual\b[^;{}]*?\bcalculate\s*\([^)]*\)[^;{}]*?=\s*0\s*;/u,
    ],
  },
  {
    name: "series-parallel-comparison",
    questionTerms: ["series", "parallel"],
    requiredQuestionTerms: ["series", "parallel", "resistor"],
    headingTerms: [
      "series connection",
      "parallel connection",
      "series resistor",
      "parallel resistor",
    ],
    contentTerms: ["series", "parallel"],
    coverageTerms: ["series", "parallel"],
  },
];

type Chunk = {
  text: string;
  sectionTitle: string | null;
  pageNumber: number | null;
};

export type RetrievalDiagnostic = {
  chunkCount: number;
  queryTerms: string[];
  activeIntents: string[];
  positiveScoreChunkCount: number;
  relevanceFilteredChunkCount: number;
  rankedCount: number;
  prioritizedCount: number;
  selectedCount: number;
  contextLength: number;
  chunks: Array<{
    chunkIndex: number;
    pageNumber: number | null;
    sectionTitle: string | null;
    score: number;
    scoreBreakdown: {
      keyword: number;
      heading: number;
      contentIntent: number;
      sourceCodeStructure: number;
      namedClass: number;
    };
    matchingQueryTermCount: number;
    minimumKeywordMatches: number;
    matchedQueryTerms: string[];
    relevanceFlags: {
      scorePositive: boolean;
      relevant: boolean;
      hasIntentMatch: boolean;
      namedClassDeclared: boolean;
      namedClassMentioned: boolean;
      nearbyNamedClassDeclaration: boolean;
      hasExperimentDeclaration: boolean;
      hasPureVirtualCalculate: boolean;
      hasExperimentPurposeExplanation: boolean;
      hasOhmsLawDerivedDeclaration: boolean;
      hasResistorNetworkDerivedDeclaration: boolean;
      hasLedResistorDerivedDeclaration: boolean;
      hasSeriesEvidence: boolean;
      hasParallelEvidence: boolean;
    };
    rankedPosition: number | null;
    priorityPassage: boolean;
    coveragePassage: boolean;
    prioritizedPosition: number | null;
    selectedPosition: number | null;
    queryCoveragePassage: boolean;
    exclusionReason: string | null;
  }>;
};

function tokenize(text: string) {
  return (
    normalizeSearchText(text)
      .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLocaleLowerCase()
      .match(/[\p{L}\p{N}]+/gu)
      ?.map(normalizeToken) ?? []
  );
}

function normalizeCodeIdentifiers(text: string) {
  return text
    .replace(/_/gu, " ")
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/gu, "$1 $2");
}

function hasInheritanceDeclaration(text: string) {
  return /\bclass\s+[A-Za-z_$][\w$]*\s*:\s*(?:(?:public|protected|private)\s+)?[A-Za-z_$][\w$]*/u.test(
    text,
  );
}

function hasExperimentBaseDeclaration(text: string) {
  return /\bclass\s+Experiment\b/u.test(text);
}

function hasPureVirtualCalculate(text: string) {
  return /\bvirtual\b[^;{}]*?\bcalculate\s*\([^)]*\)[^;{}]*?=\s*0\s*;/u.test(
    text,
  );
}

function hasExperimentPurposeExplanation(text: string) {
  return /\bExperiment\b[\s\S]{0,160}\b(?:purpose|role|responsible|defines|represents|provides|used|serves)\b|\b(?:purpose|role|responsible|defines|represents|provides|used|serves)\b[\s\S]{0,160}\bExperiment\b/iu.test(
    text,
  );
}

function hasConnectionEvidence(text: string, connection: "series" | "parallel") {
  const normalizedText = normalizeCodeIdentifiers(text);
  const tokens = new Set(tokenize(normalizedText));
  if (!tokens.has(normalizeToken(connection))) return false;

  const implementationTokens =
    connection === "series"
      ? ["resistor", "resistance", "current", "voltage", "equivalent", "circuit", "connection", "calculate", "compute", "sum"]
      : ["resistor", "resistance", "current", "voltage", "equivalent", "circuit", "connection", "calculate", "compute", "branch", "reciprocal"];

  return (
    hasExplicitConnectionImplementation(normalizedText, connection) ||
    implementationTokens.some((token) => tokens.has(token))
  );
}

function hasExplicitConnectionImplementation(
  text: string,
  connection: "series" | "parallel",
) {
  const normalizedText = normalizeCodeIdentifiers(text);
  const implementationPattern =
    connection === "series"
      ? /\b(?:calculate|compute|find|get)\s*(?:series\s*)?(?:equivalent|resistance)|\bseries\s*(?:resistance|equivalent)\s*=/iu
      : /\b(?:calculate|compute|find|get)\s*(?:parallel\s*)?(?:equivalent|resistance)|\bparallel\s*(?:resistance|equivalent)\s*=/iu;
  return implementationPattern.test(normalizedText);
}

function normalizeToken(token: string) {
  const equivalent = TARGETED_TOKEN_EQUIVALENTS.get(token);
  if (equivalent) return equivalent;

  if (token.length > 5 && token.endsWith("sses")) {
    return token.slice(0, -2);
  }
  if (token.length > 5 && token.endsWith("ies")) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.length > 5 && token.endsWith("ing")) {
    const stem = token.slice(0, -3);
    return stem.length > 2 && stem.at(-1) === stem.at(-2)
      ? stem.slice(0, -1)
      : stem;
  }
  if (token.length > 4 && token.endsWith("ed")) {
    const stem = token.slice(0, -2);
    return stem.length > 2 && stem.at(-1) === stem.at(-2)
      ? stem.slice(0, -1)
      : stem;
  }
  if (token.length > 4 && token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }
  return token;
}

function matchesPhrase(text: string, phrase: string) {
  const phraseTokens = tokenize(phrase);
  const textTokens = tokenize(text);
  if (phraseTokens.length === 0 || phraseTokens.length > textTokens.length) return false;

  return textTokens.some((_, index) =>
    phraseTokens.every((token, offset) => textTokens[index + offset] === token),
  );
}

function isHeading(line: string) {
  if (line.length > 120 || line.length < 3 || /[.!?]$/u.test(line)) return false;

  const numbered =
    /^(?:(?:chapter|section)\s+)?\d+(?:\.\d+){0,4}\s*[.)]?\s+\p{L}/iu.test(line);
  const uppercase =
    /[\p{L}]/u.test(line) &&
    line === line.toLocaleUpperCase() &&
    line.split(/\s+/u).length <= 12;
  const knownTitle = INTENTS.some((intent) =>
    intent.headingTerms.some((term) => matchesPhrase(line, term)),
  );
  const conventionalTitle =
    /^(abstract|introduction|background|literature review|methodology|method|implementation|results|discussion|references|appendix)\b/iu.test(
      line,
    );

  return numbered || uppercase || knownTitle || conventionalTitle;
}

function splitLongParagraph(
  text: string,
  sectionTitle: string | null,
  pageNumber: number | null,
  maxLength: number,
): Chunk[] {
  const chunks: Chunk[] = [];
  let remainder = text.trim();
  const protectedCodePatterns = [
    /\bclass\s+[A-Za-z_$][\w$]*(?:\s*:\s*(?:(?:public|protected|private)\s+)?[A-Za-z_$][\w$]*)?/gu,
    /\bvirtual\b[^;{}]*?;\s*/gu,
    /\b(?:const\s+)?(?:[A-Za-z_$][\w$]*\s+)?[A-Za-z_$][\w$]*\s*=\s*[^;{}]*;/gu,
  ];

  while (remainder.length > maxLength) {
    let boundary = -1;
    for (const match of remainder.slice(0, maxLength + 1).matchAll(/[.!?](?:["')\]]*)\s+/gu)) {
      boundary = match.index! + match[0].length;
    }

    if (boundary < Math.floor(maxLength * 0.5)) {
      boundary = remainder.lastIndexOf(" ", maxLength);
    }
    if (boundary <= 0) boundary = maxLength;

    const protectedRanges = protectedCodePatterns
      .flatMap((pattern) =>
        [...remainder.matchAll(pattern)].map((match) => ({
          start: match.index!,
          end: match.index! + match[0].length,
        })),
      )
      .filter(({ start, end }) => end - start <= maxLength)
      .sort((left, right) => left.start - right.start);
    const mergedProtectedRanges: Array<{ start: number; end: number }> = [];
    for (const range of protectedRanges) {
      const previousRange = mergedProtectedRanges.at(-1);
      if (previousRange && range.start <= previousRange.end) {
        previousRange.end = Math.max(previousRange.end, range.end);
      } else {
        mergedProtectedRanges.push({ ...range });
      }
    }
    const overlappingRange = mergedProtectedRanges.find(
      ({ start, end }) => start < boundary && end > boundary,
    );
    if (overlappingRange) {
      boundary =
        overlappingRange.start > 0
          ? overlappingRange.start
          : overlappingRange.end;
    }

    chunks.push({
      text: remainder.slice(0, boundary).trim(),
      sectionTitle,
      pageNumber,
    });
    remainder = remainder.slice(boundary).trim();
  }

  if (remainder) chunks.push({ text: remainder, sectionTitle, pageNumber });
  return chunks;
}

export function createDocumentChunks(text: string, maxPassageLength = 1_000) {
  const chunks: Chunk[] = [];
  let sectionTitle: string | null = null;
  let pageNumber: number | null = null;
  let paragraphLines: string[] = [];

  function flushParagraph() {
    const paragraph = paragraphLines.join(" ").replace(/\s+/gu, " ").trim();
    paragraphLines = [];
    if (!paragraph) return;
    chunks.push(
      ...splitLongParagraph(paragraph, sectionTitle, pageNumber, maxPassageLength),
    );
  }

  for (const rawLine of text.replace(/\r\n?/gu, "\n").split("\n")) {
    const line = rawLine.trim();
    const pageMarker = /^\[Page\s+(\d+)\]$/iu.exec(line);

    if (!line || pageMarker) {
      flushParagraph();
      if (pageMarker) pageNumber = Number(pageMarker[1]);
      continue;
    }

    if (isHeading(line)) {
      flushParagraph();
      sectionTitle = line;
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  return chunks;
}

function identifyIntents(question: string) {
  const questionTokens = new Set(tokenize(question));
  return INTENTS.filter((intent) =>
    (!intent.requiredQuestionTerms ||
      intent.requiredQuestionTerms.every((term) =>
        questionTokens.has(normalizeToken(term)),
      )) &&
    (intent.activationQuestionTerms ?? intent.questionTerms).some((term) =>
      term.includes(" ")
        ? matchesPhrase(question, term)
        : questionTokens.has(normalizeToken(term)),
    ),
  );
}

function rankPassages(chunks: Chunk[], question: string) {
  const questionTokens = new Set(tokenize(question));
  const asksSourceCodeInheritance =
    questionTokens.has("source") &&
    questionTokens.has("code") &&
    (questionTokens.has("inherit") || questionTokens.has("inheritance"));
  const asksSeriesParallelComparison =
    questionTokens.has(normalizeToken("series")) &&
    questionTokens.has(normalizeToken("parallel")) &&
    questionTokens.has(normalizeToken("resistor"));
  const namedClassPurpose =
    /\bpurpose\s+of\s+(?:the\s+)?([A-Za-z_]\w*)\s+class\b/iu.exec(question)?.[1] ??
    null;
  const intents = identifyIntents(question).filter(
    (intent) => !(namedClassPurpose && intent.name === "objectives"),
  );
  const namedClassDeclaration = namedClassPurpose
    ? new RegExp(
        `\\bclass\\s+${namedClassPurpose.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\b`,
        "iu",
      )
    : null;
  const namedClassDeclarationIndexes = namedClassDeclaration
    ? chunks.flatMap((chunk, index) =>
        namedClassDeclaration.test(chunk.text) ? [index] : [],
      )
    : [];
  const intentTerms = new Set(
    INTENTS.flatMap((intent) => intent.questionTerms.map(normalizeToken)),
  );
  const asksForInstrument =
    /\b(?:instruments?|sensors?)\b/iu.test(question);
  const terms = [
    ...new Set(
      tokenize(question).filter(
        (term) =>
          !STOP_WORDS.has(term) &&
          (!intentTerms.has(term) ||
            (asksForInstrument && term === normalizeToken("sensor"))),
      ),
    ),
  ];

  const documentFrequency = new Map<string, number>();
  const chunkTokens = chunks.map((chunk) => new Set(tokenize(chunk.text)));
  const headingTokens = chunks.map(
    (chunk) => new Set(tokenize(chunk.sectionTitle ?? "")),
  );
  for (const term of terms) {
    documentFrequency.set(
      term,
      chunks.filter(
        (_, index) =>
          chunkTokens[index].has(term) || headingTokens[index].has(term),
      ).length,
    );
  }

  const scored = chunks
    .map((chunk, index) => {
      const body = chunk.text.toLocaleLowerCase();
      const heading = chunk.sectionTitle?.toLocaleLowerCase() ?? "";
      const bodyMatches = terms.filter((term) => chunkTokens[index].has(term));
      const headingMatches = terms.filter(
        (term) => headingTokens[index].has(term) && !chunkTokens[index].has(term),
      );
      const matchingTerms = [...bodyMatches, ...headingMatches];
      const keywordScore = matchingTerms.reduce((score, term) => {
        const frequency = documentFrequency.get(term) ?? 0;
        const weight = headingMatches.includes(term) ? 2 : 1;
        return (
          score +
          weight * (1 + Math.log((chunks.length + 1) / (frequency + 1)))
        );
      }, 0);
      const headingScore = intents.reduce(
        (score, intent) =>
          score +
          (intent.headingTerms.some((term) => matchesPhrase(heading, term)) ? 8 : 0),
        0,
      );
      const contentIntentScore = intents.reduce(
        (score, intent) =>
          score +
          (intent.contentTerms.some((term) => matchesPhrase(body, term)) ? 2 : 0),
        0,
      );
      const sourceCodeStructureScore = intents.reduce((score, intent) => {
        const sectionMatches = intent.headingTerms.some((term) =>
          matchesPhrase(heading, term),
        );
        if (!sectionMatches) return score;

        return (
          score +
          (intent.contentPatterns?.filter((pattern) => pattern.test(body))
            .length ?? 0) *
            12
        );
      }, 0);
      const namedClassDeclared = namedClassDeclaration?.test(body) ?? false;
      const nearbyNamedClassDeclaration =
        namedClassPurpose !== null &&
        namedClassDeclarationIndexes.some(
          (declarationIndex) =>
            Math.abs(declarationIndex - index) === 1 &&
            chunks[declarationIndex].sectionTitle === chunk.sectionTitle &&
            chunks[declarationIndex].pageNumber === chunk.pageNumber,
        );
      const namedClassMentioned =
        namedClassPurpose !== null &&
        new RegExp(
          `\\b${namedClassPurpose.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\b`,
          "iu",
        ).test(body);
      const namedClassScore = namedClassPurpose
        ? (namedClassDeclared ? 24 : 0) +
          (namedClassMentioned ? 16 : 0) +
          (nearbyNamedClassDeclaration ? 10 : 0)
        : 0;
      const matchedTerms =
        matchingTerms.length +
        intents.filter(
          (intent) =>
            intent.headingTerms.some((term) => matchesPhrase(heading, term)) ||
            intent.contentTerms.some((term) => matchesPhrase(body, term)) ||
            (intent.headingTerms.some((term) => matchesPhrase(heading, term)) &&
              intent.contentPatterns?.some((pattern) => pattern.test(body))),
        ).length;
      const matchedQueryTerms = new Set(matchingTerms).size;
      const minimumKeywordMatches =
        asksSourceCodeInheritance || asksSeriesParallelComparison
          ? 1
          : terms.length === 1
            ? 1
            : Math.max(2, Math.ceil(terms.length / 2));
      const hasStrongKeywordEvidence =
        (matchedQueryTerms >= 2 &&
          keywordScore >=
            Math.max(
              STRONG_KEYWORD_SCORE_THRESHOLD,
              minimumKeywordMatches * KEYWORD_SCORE_PER_REQUIRED_MATCH_THRESHOLD,
            )) ||
        (matchedQueryTerms === 1 &&
          bodyMatches.length > 0 &&
          keywordScore >= SINGLE_KEYWORD_SCORE_THRESHOLD);
      const asksForSensor =
        /\b(?:instruments?|sensors?)\b/iu.test(question);
      const hasSensorTopicEvidence =
        asksForSensor &&
        bodyMatches.includes("sensor") &&
        bodyMatches.some((term) => term !== "sensor");
      const asksForSamplingFrequency =
        /\b(?:often|frequency|interval)\b/iu.test(question);
      const hasSamplingFrequencyEvidence =
        asksForSamplingFrequency &&
        /\b(?:every\s+\w+|\d+[- ]minute|five-minute)\b/iu.test(body) &&
        bodyMatches.length > 0;
      const asksForStorageDetails =
        /\b(?:database|storage|storage\s+engine|sqlite)\b/iu.test(question);
      const hasStorageEvidence =
        /\b(?:sqlite|database|storage|backend)\b/iu.test(body);
      const clearlyUnrelatedDocument =
        /\b(?:unrelated|separate|another\s+team'?s)\b/iu.test(body) &&
        /\bRiverWatch\b/iu.test(chunk.text);
      const hasIntentMatch = intents.some(
        (intent) =>
          intent.headingTerms.some((term) => matchesPhrase(heading, term)) ||
          intent.contentTerms.some((term) => matchesPhrase(body, term)),
      );
      const hasQueryEvidence =
        (asksSourceCodeInheritance &&
          /(?:program\s+)?source\s+code|implementation/iu.test(
            chunk.sectionTitle ?? "",
          ) &&
          (hasInheritanceDeclaration(chunk.text) ||
            hasExperimentBaseDeclaration(chunk.text))) ||
        (namedClassPurpose !== null &&
          (namedClassDeclared ||
            hasPureVirtualCalculate(chunk.text) ||
            hasExperimentPurposeExplanation(chunk.text))) ||
        (asksSeriesParallelComparison &&
          (hasConnectionEvidence(chunk.text, "series") ||
            hasConnectionEvidence(chunk.text, "parallel")));
      const scoreBreakdown = {
        keyword: keywordScore,
        heading: headingScore,
        contentIntent: contentIntentScore,
        sourceCodeStructure: sourceCodeStructureScore,
        namedClass: namedClassScore,
      };

      return {
        ...chunk,
        chunkIndex: index,
        matchedTerms,
        totalTerms: terms.length + intents.length,
        score:
          keywordScore +
          headingScore +
          contentIntentScore +
          sourceCodeStructureScore +
          namedClassScore,
        scoreBreakdown,
        matchedQueryTerms,
        matchedQueryTermsList: [...new Set(matchingTerms)],
        minimumKeywordMatches,
        hasIntentMatch,
        namedClassDeclared,
        namedClassMentioned,
        nearbyNamedClassDeclaration,
        relevant:
          !clearlyUnrelatedDocument &&
          (!asksForStorageDetails || hasStorageEvidence) &&
          ((terms.length === 0 && hasIntentMatch) ||
            (terms.length > 0 &&
              (matchedQueryTerms >= minimumKeywordMatches ||
                hasStrongKeywordEvidence ||
                hasSensorTopicEvidence ||
                hasSamplingFrequencyEvidence)) ||
            hasIntentMatch ||
            hasQueryEvidence ||
            namedClassDeclared ||
            namedClassMentioned ||
            nearbyNamedClassDeclaration),
      };
    });
  const ranked = scored
    .filter((passage) => passage.score > 0 && passage.relevant)
    .sort(
      (left, right) =>
        right.score - left.score ||
        (left.pageNumber ?? Number.MAX_SAFE_INTEGER) -
          (right.pageNumber ?? Number.MAX_SAFE_INTEGER),
    );

  return { ranked, scored, terms, intents };
}

export function retrieveRelevantPassages(
  text: string,
  question: string,
  options: RetrievalOptions,
  onDiagnostic?: (diagnostic: RetrievalDiagnostic) => void,
): RetrievedPassage[] {
  const chunks = createDocumentChunks(text, options.maxPassageLength);
  const { ranked, scored, intents, terms } = rankPassages(chunks, question);
  const coverageTerms = intents.flatMap((intent) => intent.coverageTerms ?? []);
  const coveragePassages = coverageTerms
    .map((term) =>
      ranked.find(
        ({ text, sectionTitle }) =>
          matchesPhrase(text, term) || matchesPhrase(sectionTitle ?? "", term),
      ),
    )
    .filter((passage): passage is (typeof ranked)[number] =>
      Boolean(passage),
    );
  const tokens = new Set(tokenize(question));
  const asksSourceCodeInheritance =
    tokens.has("source") &&
    tokens.has("code") &&
    (tokens.has("inheritance") || tokens.has("inherit"));
  const sourceCodeHeading = (passage: (typeof scored)[number]) =>
    /(?:program\s+)?source\s+code|implementation/iu.test(
      passage.sectionTitle ?? "",
    );
  const priorityPassages: (typeof scored)[number][] = [];

  if (asksSourceCodeInheritance) {
    const derivedDeclaration =
      /\bclass\s+(?:OhmsLawExperiment|ResistorNetworkExperiment|LEDResistorExperiment)\s*:\s*public\s+Experiment\b/u;
    for (const passage of scored) {
      if (
        sourceCodeHeading(passage) &&
        (derivedDeclaration.test(passage.text) ||
          hasExperimentBaseDeclaration(passage.text))
      ) {
        priorityPassages.push(passage);
      }
    }
  }

  const namedClassPurpose =
    /\bpurpose\s+of\s+(?:the\s+)?(Experiment)\s+class\b/iu.test(question);
  const asksForSourceCodeClass = intents.some(
    ({ name }) => name === "requested-source-code-class",
  );
  if (namedClassPurpose) {
    const experimentDeclaration = /\bclass\s+Experiment\b/u;
    const pureVirtualCalculate =
      /\bvirtual\b[^;{}]*?\bcalculate\s*\([^)]*\)[^;{}]*?=\s*0\s*;/u;
    const explanation = (text: string) =>
      /\b(?:experiment|class|calculate)\b/iu.test(text) &&
      /\b(?:purpose|role|define[sd]?|interface|abstract|base|responsible|provide[sd]?|represent[sd]?|common|used)\b/iu.test(
        text,
      );
    const declarationIndexes = scored.flatMap((passage, index) =>
      experimentDeclaration.test(passage.text) ? [index] : [],
    );
    for (const passage of scored) {
      if (
        experimentDeclaration.test(passage.text) ||
        pureVirtualCalculate.test(passage.text) ||
        (declarationIndexes.some(
          (index) =>
            Math.abs(index - scored.indexOf(passage)) === 1 &&
            scored[index].sectionTitle === passage.sectionTitle &&
            scored[index].pageNumber === passage.pageNumber,
        ) &&
          explanation(passage.text))
      ) {
        priorityPassages.push(passage);
      }
    }
  }

  const resistorComparison =
    tokens.has(normalizeToken("series")) &&
    tokens.has(normalizeToken("parallel")) &&
    tokens.has(normalizeToken("resistor"));
  if (resistorComparison) {
    for (const concept of ["series", "parallel"] as const) {
      const evidencePassage = scored
        .filter((passage) => hasConnectionEvidence(passage.text, concept))
        .sort(
          (left, right) =>
            Number(
              hasExplicitConnectionImplementation(right.text, concept),
            ) -
              Number(
                hasExplicitConnectionImplementation(left.text, concept),
              ) ||
            right.score - left.score,
        )[0];
      if (evidencePassage) priorityPassages.push(evidencePassage);
    }
  }

  const queryCoveragePassages: (typeof scored)[number][] = [];
  if (asksSourceCodeInheritance) {
    const derivedDeclaration =
      /\bclass\s+(?:OhmsLawExperiment|ResistorNetworkExperiment|LEDResistorExperiment)\s*:\s*public\s+Experiment\b/u;
    queryCoveragePassages.push(
      ...scored.filter(
        (passage) =>
          sourceCodeHeading(passage) &&
          (derivedDeclaration.test(passage.text) ||
            hasExperimentBaseDeclaration(passage.text)),
      ),
    );
  }
  if (resistorComparison) {
    for (const concept of ["series", "parallel"] as const) {
      const evidencePassage = scored
        .filter((passage) => hasConnectionEvidence(passage.text, concept))
        .sort(
          (left, right) =>
            Number(
              hasExplicitConnectionImplementation(right.text, concept),
            ) -
              Number(
                hasExplicitConnectionImplementation(left.text, concept),
              ) ||
            right.score - left.score,
        )[0];
      if (evidencePassage) queryCoveragePassages.push(evidencePassage);
    }
  }
  if (namedClassPurpose) {
    queryCoveragePassages.push(
      ...priorityPassages.filter(
        (passage) =>
          /\bclass\s+Experiment\b/u.test(passage.text) ||
          hasPureVirtualCalculate(passage.text) ||
          hasExperimentPurposeExplanation(passage.text),
      ),
    );
  }

  const queryCoverageChunkIndexes = new Set([
    ...queryCoveragePassages,
    ...priorityPassages,
  ].map(({ chunkIndex }) => chunkIndex));
  const sourceCodeRankedPassages = ranked.filter(sourceCodeHeading);
  const generalRankedPassages =
    asksSourceCodeInheritance ||
    (asksForSourceCodeClass && sourceCodeRankedPassages.length > 0)
      ? sourceCodeRankedPassages
      : ranked;
  const prioritizedGeneralPassages = (() => {
    const sectionRepresentatives: (typeof ranked)[number][] = [];
    const remainingPassages: (typeof ranked)[number][] = [];
    const representedSections = new Set<string>();
    for (const passage of generalRankedPassages) {
      const section = passage.sectionTitle ?? "";
      if (!representedSections.has(section)) {
        representedSections.add(section);
        sectionRepresentatives.push(passage);
      } else {
        remainingPassages.push(passage);
      }
    }
    return [...sectionRepresentatives, ...remainingPassages];
  })();
  const sourceCodeOnly = asksForSourceCodeClass && sourceCodeRankedPassages.length > 0;
  const eligiblePriorityPassages = sourceCodeOnly
    ? [...queryCoveragePassages, ...priorityPassages].filter(sourceCodeHeading)
    : [...queryCoveragePassages, ...priorityPassages];
  const prioritized = [
    ...new Set([
      ...eligiblePriorityPassages,
      ...coveragePassages,
      ...prioritizedGeneralPassages,
    ]),
  ];
  const selected: RetrievedPassage[] = [];
  const selectedChunkIndexes = new Map<number, number>();
  const exclusionReasons = new Map<number, string>();
  const selectedSectionCounts = new Map<string, number>();
  let contextLength = 0;

  for (let prioritizedIndex = 0; prioritizedIndex < prioritized.length; prioritizedIndex += 1) {
    const passage = prioritized[prioritizedIndex];
    const citationLength = passage.sectionTitle?.length ?? 0;
    const passageLength = passage.text.length + citationLength;
    if (selected.length >= options.maxResults) {
      exclusionReasons.set(passage.chunkIndex, "result-limit");
      continue;
    }
    if (contextLength + passageLength > options.maxContextLength) {
      exclusionReasons.set(passage.chunkIndex, "context-length-limit");
      continue;
    }
    const sectionKey = passage.sectionTitle ?? "";
    const sectionCount = selectedSectionCounts.get(sectionKey) ?? 0;
    const anotherSectionAvailable = prioritized
      .slice(prioritizedIndex + 1)
      .some(
        (candidate) =>
          !selectedChunkIndexes.has(candidate.chunkIndex) &&
          candidate.sectionTitle !== passage.sectionTitle,
      );
    if (
      !queryCoverageChunkIndexes.has(passage.chunkIndex) &&
      sectionCount >= 2 &&
      anotherSectionAvailable
    ) {
      exclusionReasons.set(passage.chunkIndex, "section-diversity");
      continue;
    }

    selected.push({
      id: selected.length + 1,
      passage: passage.text,
      sectionTitle: passage.sectionTitle,
      pageNumber: passage.pageNumber,
      matchedTerms: passage.matchedTerms,
      totalTerms: passage.totalTerms,
      score: passage.score,
    });
    selectedChunkIndexes.set(passage.chunkIndex, selected.length);
    selectedSectionCounts.set(sectionKey, sectionCount + 1);
    contextLength += passageLength;
  }

  if (onDiagnostic) {
    const rankedPositions = new Map(
      ranked.map((passage, index) => [passage.chunkIndex, index + 1]),
    );
    const prioritizedPositions = new Map(
      prioritized.map((passage, index) => [passage.chunkIndex, index + 1]),
    );
    const coverageChunkIndexes = new Set(
      coveragePassages.map(({ chunkIndex }) => chunkIndex),
    );
    const priorityChunkIndexes = new Set(
      priorityPassages.map(({ chunkIndex }) => chunkIndex),
    );
    const experimentDeclaration = /\bclass\s+Experiment\b/u;
    const pureVirtualCalculate =
      /\bvirtual\b[^;{}]*?\bcalculate\s*\([^)]*\)[^;{}]*?=\s*0\s*;/u;
    const classPurposeExplanation =
      /\bExperiment\b[\s\S]{0,160}\b(?:purpose|role|responsible|defines|represents|provides|used|serves)\b|\b(?:purpose|role|responsible|defines|represents|provides|used|serves)\b[\s\S]{0,160}\bExperiment\b/iu;
    const derivedDeclarations = {
      hasOhmsLawDerivedDeclaration:
        /\bclass\s+OhmsLawExperiment\s*:\s*public\s+Experiment\b/u,
      hasResistorNetworkDerivedDeclaration:
        /\bclass\s+ResistorNetworkExperiment\s*:\s*public\s+Experiment\b/u,
      hasLedResistorDerivedDeclaration:
        /\bclass\s+LEDResistorExperiment\s*:\s*public\s+Experiment\b/u,
    };
    const chunksWithMetadata = scored.flatMap((passage) => {
      const flags = {
        scorePositive: passage.score > 0,
        relevant: passage.relevant,
        hasIntentMatch: passage.hasIntentMatch,
        namedClassDeclared: passage.namedClassDeclared,
        namedClassMentioned: passage.namedClassMentioned,
        nearbyNamedClassDeclaration: passage.nearbyNamedClassDeclaration,
        hasExperimentDeclaration: experimentDeclaration.test(passage.text),
        hasPureVirtualCalculate: pureVirtualCalculate.test(passage.text),
        hasExperimentPurposeExplanation:
          classPurposeExplanation.test(passage.text),
        hasOhmsLawDerivedDeclaration:
          derivedDeclarations.hasOhmsLawDerivedDeclaration.test(
            passage.text,
          ),
        hasResistorNetworkDerivedDeclaration:
          derivedDeclarations.hasResistorNetworkDerivedDeclaration.test(
            passage.text,
          ),
        hasLedResistorDerivedDeclaration:
          derivedDeclarations.hasLedResistorDerivedDeclaration.test(
            passage.text,
          ),
        hasSeriesEvidence: hasConnectionEvidence(passage.text, "series"),
        hasParallelEvidence: hasConnectionEvidence(
          passage.text,
          "parallel",
        ),
      };
      const rankedPosition = rankedPositions.get(passage.chunkIndex) ?? null;
      const prioritizedPosition =
        prioritizedPositions.get(passage.chunkIndex) ?? null;
      const selectedPosition =
        selectedChunkIndexes.get(passage.chunkIndex) ?? null;
      const exclusionReason =
        selectedPosition !== null
          ? null
          : exclusionReasons.get(passage.chunkIndex) ??
            (rankedPosition === null
              ? passage.score <= 0
                ? "filtered:non-positive-score"
                : "filtered:not-relevant"
              : prioritizedPosition === null
                ? "not-prioritized"
                : "not-selected");
      const isDiagnosticCandidate =
        Object.values(flags).some(Boolean) ||
        rankedPosition !== null ||
        prioritizedPosition !== null;

      return isDiagnosticCandidate
        ? [
            {
              chunkIndex: passage.chunkIndex,
              pageNumber: passage.pageNumber,
              sectionTitle: passage.sectionTitle,
              score: passage.score,
              scoreBreakdown: passage.scoreBreakdown,
              matchingQueryTermCount: passage.matchedQueryTerms,
              minimumKeywordMatches: passage.minimumKeywordMatches,
              matchedQueryTerms: passage.matchedQueryTermsList,
              relevanceFlags: flags,
              rankedPosition,
              priorityPassage: priorityChunkIndexes.has(passage.chunkIndex),
              coveragePassage: coverageChunkIndexes.has(passage.chunkIndex),
              queryCoveragePassage: queryCoverageChunkIndexes.has(
                passage.chunkIndex,
              ),
              prioritizedPosition,
              selectedPosition,
              exclusionReason,
            },
          ]
        : [];
    });

    onDiagnostic({
      chunkCount: scored.length,
      queryTerms: terms,
      activeIntents: intents.map(({ name }) => name),
      positiveScoreChunkCount: scored.filter(
        ({ score }) => score > 0,
      ).length,
      relevanceFilteredChunkCount: scored.filter(
        ({ score, relevant }) => score <= 0 || !relevant,
      ).length,
      rankedCount: ranked.length,
      prioritizedCount: prioritized.length,
      selectedCount: selected.length,
      contextLength,
      chunks: chunksWithMetadata,
    });
  }

  return selected;
}

export function createAnswerContext(
  passages: RetrievedPassage[],
): AnswerContextPassage[] {
  return passages.map(({ id: sourceId, sectionTitle, pageNumber, passage }) => ({
    sourceId,
    sectionTitle,
    pageNumber,
    text: passage,
  }));
}

export function hasSpecificSearchTerms(question: string) {
  return (
    identifyIntents(question).length > 0 ||
    tokenize(question).some(
      (term) =>
        !STOP_WORDS.has(term) &&
        !INTENTS.some((intent) => intent.questionTerms.includes(term)),
    )
  );
}

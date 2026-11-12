import assert from "node:assert/strict";
import { deflateRawSync } from "node:zlib";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { formatPdfPages } from "../lib/documents/pdf-extraction.ts";
import { retrieveRelevantPassages } from "../lib/documents/retrieval.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = resolve(
  ROOT,
  "test-fixtures",
  ".generated",
  "large-document-performance",
);
const PAGE_COUNTS = [10, 50, 100];
const EXTRACTION_RUNS = 3;
const RETRIEVAL_RUNS = 3;
const RETRIEVAL_OPTIONS = {
  maxResults: 6,
  maxPassageLength: 1_000,
  maxContextLength: 6_000,
};

const cases = [
  {
    id: "early",
    question: "Which hardware components are included in the RiverWatch field node?",
    evidence: [
      "Hardware components include a Raspberry Pi Zero 2 W, an optical turbidity sensor, a waterproof temperature probe, a LoRa radio, and a 12-volt battery.",
    ],
  },
  {
    id: "middle",
    question: "What happens if the radio link is unavailable?",
    evidence: [
      "If the radio link is unavailable, the node retains readings in SQLite and queues summaries for retransmission after the connection returns.",
    ],
  },
  {
    id: "late",
    question: "How long did the 12-volt battery last in the bench trial?",
    evidence: [
      "At five-minute sampling intervals, the 12-volt battery lasted six days in the bench trial.",
    ],
  },
  {
    id: "multi-section",
    question: "How often does the controller sample the probes, and how long did the battery last?",
    evidence: [
      "Every five minutes, the controller samples both probes, attaches a UTC timestamp, writes the reading to local SQLite, and queues a summary for LoRa transmission.",
      "At five-minute sampling intervals, the 12-volt battery lasted six days in the bench trial.",
    ],
  },
];

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) {
    crc = (crc & 1) ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return crc >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeZip(entries) {
  const localRecords = [];
  const centralRecords = [];
  let localOffset = 0;

  for (const [name, content] of entries) {
    const nameBytes = Buffer.from(name, "utf8");
    const source = Buffer.from(content, "utf8");
    const compressed = deflateRawSync(source);
    const checksum = crc32(source);
    const local = Buffer.alloc(30 + nameBytes.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(source.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    nameBytes.copy(local, 30);
    localRecords.push(local, compressed);

    const central = Buffer.alloc(46 + nameBytes.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(source.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(localOffset, 42);
    nameBytes.copy(central, 46);
    centralRecords.push(central);
    localOffset += local.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centralRecords);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localOffset, 16);
  return Buffer.concat([...localRecords, centralDirectory, end]);
}

function pageContents(page, pageCount) {
  const sections = [];
  if (page === 1) {
    sections.push(
      [
        "1. HARDWARE COMPONENTS",
        "Hardware components include a Raspberry Pi Zero 2 W, an optical turbidity sensor, a waterproof temperature probe, a LoRa radio, and a 12-volt battery.",
      ].join("\n"),
    );
  }
  if (page === Math.ceil(pageCount / 2)) {
    sections.push(
      [
        "2. NETWORK OUTAGE HANDLING",
        "If the radio link is unavailable, the node retains readings in SQLite and queues summaries for retransmission after the connection returns.",
      ].join("\n"),
    );
  }
  if (page === Math.ceil(pageCount * 0.65)) {
    sections.push(
      [
        "3. SAMPLING WORKFLOW",
        "Every five minutes, the controller samples both probes, attaches a UTC timestamp, writes the reading to local SQLite, and queues a summary for LoRa transmission.",
      ].join("\n"),
    );
  }
  if (page === pageCount) {
    sections.push(
      [
        "4. BATTERY OBSERVATION",
        "At five-minute sampling intervals, the 12-volt battery lasted six days in the bench trial.",
      ].join("\n"),
    );
  }

  sections.push(
    `ARCHIVE FIELD NOTES\nPage ${page} records unrelated cloud cover and wind direction for a separate observatory. These notes contain no RiverWatch sensor measurements.`,
  );
  return sections.join("\n\n");
}

function makeTextDocument(pageCount) {
  return Array.from({ length: pageCount }, (_, index) => {
    const page = index + 1;
    return `[Page ${page}]\n${pageContents(page, pageCount)}`;
  }).join("\n\n");
}

function escapeXml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function makeDocxDocument(pageCount) {
  const paragraphs = [];
  for (let page = 1; page <= pageCount; page += 1) {
    paragraphs.push(`[Page ${page}]`, ...pageContents(page, pageCount).split("\n"));
  }
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${paragraphs
    .map(
      (paragraph) =>
        `<w:p><w:r><w:t xml:space="preserve">${escapeXml(paragraph)}</w:t></w:r></w:p>`,
    )
    .join("")}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body>
</w:document>`;
  return makeZip([
    [
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
    ],
    [
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    ],
    ["word/document.xml", documentXml],
  ]);
}

function pdfString(text) {
  return text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function makePdfDocument(pageCount) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${Array.from(
      { length: pageCount },
      (_, index) => `${4 + index * 2} 0 R`,
    ).join(" ")}] /Count ${pageCount} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  for (let page = 1; page <= pageCount; page += 1) {
    const pageObject = 4 + (page - 1) * 2;
    const contentObject = pageObject + 1;
    const lines = pageContents(page, pageCount)
      .split("\n")
      .map((line, index) => `1 0 0 1 36 ${756 - index * 13} Tm (${pdfString(line)}) Tj`)
      .join("\n");
    const stream = `BT /F1 4 Tf\n${lines}\nET`;
    const streamBytes = Buffer.from(stream, "ascii");
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`,
    );
    objects.push(
      `<< /Length ${streamBytes.length} >>\nstream\n${stream}\nendstream`,
    );
  }

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, "ascii"));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, "ascii");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "ascii");
}

async function generateFixtures() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const fixtures = [];
  for (const pageCount of PAGE_COUNTS) {
    const definitions = [
      ["pdf", ".pdf", () => makePdfDocument(pageCount)],
      ["docx", ".docx", () => makeDocxDocument(pageCount)],
      ["txt", ".txt", () => Buffer.from(makeTextDocument(pageCount), "utf8")],
    ];
    for (const [format, extension, create] of definitions) {
      const path = resolve(OUTPUT_DIR, `${pageCount}-pages${extension}`);
      const bytes = create();
      await writeFile(path, bytes);
      fixtures.push({ pageCount, format, path, fileSizeBytes: bytes.length });
    }
  }
  return fixtures;
}

function memorySnapshot() {
  const { rss, heapUsed } = process.memoryUsage();
  return { rssBytes: rss, heapUsedBytes: heapUsed };
}

async function extractFixture(format, bytes) {
  if (format === "pdf") {
    const parser = new PDFParse({ data: bytes });
    try {
      const result = await parser.getText();
      const text = result.pages.some((page) => page.text.trim())
        ? formatPdfPages(result.pages, result.total).trim()
        : result.text.trim();
      return { text, physicalPageCount: result.total };
    } finally {
      await parser.destroy();
    }
  }
  if (format === "docx") {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return { text: result.value.trim(), physicalPageCount: null };
  }
  return {
    text: new TextDecoder("utf-8", { fatal: true })
      .decode(bytes)
      .replace(/^\uFEFF/u, "")
      .trim(),
    physicalPageCount: null,
  };
}

async function measureExtraction(fixture) {
  const bytes = await readFile(fixture.path);
  const runs = [];
  let extractedText = "";
  let physicalPageCount = null;
  for (let run = 1; run <= EXTRACTION_RUNS; run += 1) {
    const memoryBefore = memorySnapshot();
    const started = performance.now();
    try {
      const result = await extractFixture(fixture.format, bytes);
      const durationMs = performance.now() - started;
      const memoryAfter = memorySnapshot();
      extractedText = result.text;
      physicalPageCount = result.physicalPageCount;
      runs.push({
        run,
        status: "PASS",
        durationMs: Number(durationMs.toFixed(3)),
        extractedCharacterCount: result.text.length,
        pageMarkerCount: (result.text.match(/^\[Page \d+\]$/gmu) ?? []).length,
        physicalPageCount: result.physicalPageCount,
        memoryBefore,
        memoryAfter,
      });
    } catch (error) {
      runs.push({
        run,
        status: "FAIL",
        durationMs: Number((performance.now() - started).toFixed(3)),
        memoryBefore,
        memoryAfter: memorySnapshot(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const durations = runs
    .filter(({ status }) => status === "PASS")
    .map(({ durationMs }) => durationMs);
  const average = (values) =>
    values.length
      ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3))
      : null;
  return {
    text: extractedText,
    report: {
      runs,
      averageDurationMs: average(durations),
      extractedCharacterCount: extractedText.length,
      pageMarkerCount: (extractedText.match(/^\[Page \d+\]$/gmu) ?? []).length,
      physicalPageCount,
      successfulRunCount: durations.length,
    },
  };
}

function measureRetrieval(text, testCase) {
  const runs = [];
  for (let run = 1; run <= RETRIEVAL_RUNS; run += 1) {
    const memoryBefore = memorySnapshot();
    const started = performance.now();
    try {
      const passages = retrieveRelevantPassages(
        text,
        testCase.question,
        RETRIEVAL_OPTIONS,
      );
      const durationMs = performance.now() - started;
      const memoryAfter = memorySnapshot();
      const evidenceRanks = testCase.evidence.map((evidence) => {
        const index = passages.findIndex(({ passage }) => passage.includes(evidence));
        return index === -1 ? null : index + 1;
      });
      runs.push({
        run,
        status: "PASS",
        durationMs: Number(durationMs.toFixed(3)),
        resultCount: passages.length,
        contextCharacterCount: passages.reduce(
          (total, { passage }) => total + passage.length,
          0,
        ),
        evidenceRanks,
        top3Success: evidenceRanks.every((rank) => rank !== null && rank <= 3),
        top6Success: evidenceRanks.every((rank) => rank !== null && rank <= 6),
        memoryBefore,
        memoryAfter,
      });
    } catch (error) {
      runs.push({
        run,
        status: "FAIL",
        durationMs: Number((performance.now() - started).toFixed(3)),
        memoryBefore,
        memoryAfter: memorySnapshot(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  const successful = runs.filter(({ status }) => status === "PASS");
  const averageDurationMs = successful.length
    ? Number(
        (
          successful.reduce((total, { durationMs }) => total + durationMs, 0) /
          successful.length
        ).toFixed(3),
      )
    : null;
  return {
    id: testCase.id,
    question: testCase.question,
    expectedEvidence: testCase.evidence,
    runs,
    averageDurationMs,
    top3SuccessCount: successful.filter(({ top3Success }) => top3Success).length,
    top6SuccessCount: successful.filter(({ top6Success }) => top6Success).length,
  };
}

async function main() {
  if (process.argv.includes("--clean")) {
    await rm(OUTPUT_DIR, { recursive: true, force: true });
    console.log(`Removed generated fixtures and report: ${OUTPUT_DIR}`);
    return;
  }

  const fixtureFiles = await generateFixtures();
  const results = [];
  for (const fixture of fixtureFiles) {
    const file = await stat(fixture.path);
    const extractionResult = await measureExtraction(fixture);
    const extraction = extractionResult.report;
    const text = extractionResult.text;
    const expectedMarkers = fixture.pageCount;
    const failures = [];
    if (file.size >= 10 * 1024 * 1024) {
      failures.push("Fixture is not below the application's 10 MiB upload limit.");
    }
    if (fixture.format === "pdf" && extraction.physicalPageCount !== fixture.pageCount) {
      failures.push(
        `Expected ${fixture.pageCount} physical PDF pages; extracted ${extraction.physicalPageCount}.`,
      );
    }
    if (extraction.pageMarkerCount !== expectedMarkers) {
      failures.push(
        `Expected ${expectedMarkers} page markers; extracted ${extraction.pageMarkerCount}.`,
      );
    }
    const retrieval = cases.map((testCase) => measureRetrieval(text, testCase));
    results.push({
      pageCount: fixture.pageCount,
      format: fixture.format,
      file: fixture.path,
      fileSizeBytes: file.size,
      extraction,
      retrieval,
      fixtureValidation: failures.length ? { status: "FAIL", failures } : { status: "PASS" },
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: "offline; no Gemini, Supabase, or network calls",
    extractionRunsPerFixture: EXTRACTION_RUNS,
    retrievalRunsPerQuestion: RETRIEVAL_RUNS,
    retrievalOptions: RETRIEVAL_OPTIONS,
    memoryMethod:
      "process.memoryUsage() RSS and heapUsed snapshots immediately before and after each operation; snapshots are not peak measurements, GC is not forced, and RSS includes Node/native-library memory.",
    accuracyMethod:
      "Evidence counts as retrieved only when the exact expected evidence string occurs in a returned passage; multi-section top-k succeeds only when all expected evidence strings occur within k results.",
    results,
  };
  const reportPath = resolve(OUTPUT_DIR, "report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Report: ${reportPath}`);
  console.log(`Generated fixtures: ${OUTPUT_DIR}`);
  for (const result of results) {
    console.log(
      `${result.pageCount}p ${result.format}: ${result.fileSizeBytes} bytes; ` +
        `extract avg ${result.extraction.averageDurationMs ?? "n/a"} ms ` +
        `(${result.extraction.successfulRunCount}/${EXTRACTION_RUNS}); ` +
        `text ${result.extraction.extractedCharacterCount} chars, ` +
        `${result.extraction.pageMarkerCount} page markers; ` +
        `retrieval avg ${result.retrieval
          .map(({ averageDurationMs }) => averageDurationMs ?? "n/a")
          .join("/")} ms (early/middle/late/multi); ` +
        `top3 ${result.retrieval.map(({ top3SuccessCount }) => top3SuccessCount).join("/")}, ` +
        `top6 ${result.retrieval.map(({ top6SuccessCount }) => top6SuccessCount).join("/")}; ` +
        `fixture ${result.fixtureValidation.status}`,
    );
  }
  console.log(`Cleanup: npm run perf:large-documents -- --clean`);
  assert.equal(results.length, PAGE_COUNTS.length * 3);
}

await main();

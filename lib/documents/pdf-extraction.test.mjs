import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";
import { formatPdfPages } from "./pdf-extraction.ts";

PDFParse.setWorker(
  pathToFileURL(
    join(
      process.cwd(),
      "node_modules",
      "pdf-parse",
      "dist",
      "pdf-parse",
      "esm",
      "pdf.worker.mjs",
    ),
  ).href,
);

function createPdfWithFourPages() {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [4 0 R 6 0 R 8 0 R 10 0 R] /Count 4 >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  for (let pageNumber = 1; pageNumber <= 4; pageNumber += 1) {
    const pageObject = 4 + (pageNumber - 1) * 2;
    const contentObject = pageObject + 1;
    const stream =
      pageNumber === 2
        ? ""
        : `BT /F1 18 Tf 50 700 Td (Fixture page ${pageNumber}) Tj ET`;

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObject} 0 R >>`,
    );
    objects.push(
      `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    );
  }

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const crossReferenceOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${crossReferenceOffset}\n%%EOF`;
  return new Uint8Array(Buffer.from(pdf));
}

test("preserves page markers and page-four text in a multi-page PDF", async () => {
  const parser = new PDFParse({ data: createPdfWithFourPages() });

  try {
    const result = await parser.getText();
    const pageFour = result.pages.find(({ num }) => num === 4);

    assert.equal(result.total, 4);
    assert.ok(pageFour?.text.trim());

    const extractedText = formatPdfPages(result.pages, result.total);
    for (let pageNumber = 1; pageNumber <= 4; pageNumber += 1) {
      assert.ok(extractedText.includes(`[Page ${pageNumber}]`));
    }
    assert.match(extractedText, /\[Page 4\]\nFixture page 4/u);
    assert.match(extractedText, /\[Page 2\]\n{2,}\[Page 3\]/u);
  } finally {
    await parser.destroy();
  }
});

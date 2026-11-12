import assert from "node:assert/strict";
import test from "node:test";
import { formatDocumentContent } from "./reader-content.ts";

test("groups wrapped lines into readable paragraphs and recognizes headings", () => {
  const blocks = formatDocumentContent(
    "INTRODUCTION\nThis paragraph was wrapped\nacross two extracted lines.\n\nConclusion\nA final paragraph.",
  );

  assert.deepEqual(blocks, [
    { type: "heading", text: "INTRODUCTION" },
    {
      type: "paragraph",
      text: "This paragraph was wrapped across two extracted lines.",
    },
    { type: "heading", text: "Conclusion" },
    { type: "paragraph", text: "A final paragraph." },
  ]);
});

test("retains page markers and formats ordered and unordered lists", () => {
  const blocks = formatDocumentContent(
    "[Page 1]\n1. First item\n2) Second item\n\n- Bullet one\n• Bullet two\n\n[Page 2]",
  );

  assert.deepEqual(blocks, [
    { type: "page", number: 1 },
    { type: "list", ordered: true, items: ["First item", "Second item"] },
    { type: "list", ordered: false, items: ["Bullet one", "Bullet two"] },
    { type: "page", number: 2 },
  ]);
});

test("returns no blocks for whitespace-only content", () => {
  assert.deepEqual(formatDocumentContent(" \n\t "), []);
});

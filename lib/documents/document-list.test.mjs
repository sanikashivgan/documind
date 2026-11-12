import assert from "node:assert/strict";
import test from "node:test";
import {
  createDocumentSearchFilter,
  DEFAULT_DOCUMENT_PAGE_SIZE,
  escapeLikeSearchTerm,
  hasMoreDocuments,
  MAX_DOCUMENT_PAGE_SIZE,
  parseDocumentListParams,
} from "./document-list.ts";

test("uses a bounded default page size", () => {
  assert.deepEqual(parseDocumentListParams(new URLSearchParams()), {
    offset: 0,
    limit: DEFAULT_DOCUMENT_PAGE_SIZE,
    search: "",
  });
});

test("caps requested page sizes and preserves valid offsets", () => {
  assert.deepEqual(
    parseDocumentListParams(
      new URLSearchParams("offset=40&limit=100&search=report"),
    ),
    { offset: 40, limit: MAX_DOCUMENT_PAGE_SIZE, search: "report" },
  );
});

test("rejects malformed or unsafe pagination and oversized search terms", () => {
  for (const query of [
    "offset=-1",
    "offset=1.5",
    "limit=0",
    "limit=abc",
    `offset=${Number.MAX_SAFE_INTEGER}`,
    `search=${"a".repeat(101)}`,
  ]) {
    assert.equal(parseDocumentListParams(new URLSearchParams(query)), null);
  }
});

test("escapes SQL LIKE wildcards in literal search terms", () => {
  assert.equal(escapeLikeSearchTerm(String.raw`a%_b\c`), String.raw`a\%\_b\\c`);
});

test("builds a quoted search filter across document names and file types", () => {
  assert.equal(
    createDocumentSearchFilter('invoice%,(draft)"'),
    String.raw`name.ilike."%invoice\%\,\(draft\)\"%",file_type.ilike."%invoice\%\,\(draft\)\"%"`,
  );
});

test("determines whether another page exists", () => {
  assert.equal(hasMoreDocuments(0, 20, 21), true);
  assert.equal(hasMoreDocuments(20, 1, 21), false);
  assert.equal(hasMoreDocuments(0, 0, 0), false);
});

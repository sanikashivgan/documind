import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  questionRequestError,
  readQuestionRequest,
} from "./request-body.ts";

const MAX_BYTES = 64;

function request(body, contentLength) {
  const headers = new Headers();
  if (contentLength !== undefined) headers.set("content-length", contentLength);
  return new Request("http://localhost/api/documents/1", {
    method: "POST",
    headers,
    body,
  });
}

for (const endpoint of ["answer", "search"]) {
  test(`${endpoint} route authenticates before bounded request parsing`, async () => {
    const route = await readFile(
      new URL(`../../app/api/documents/[id]/${endpoint}/route.ts`, import.meta.url),
      "utf8",
    );

    assert.ok(
      route.indexOf("supabase.auth.getUser()") <
        route.indexOf("readQuestionRequest(request, MAX_REQUEST_SIZE)"),
    );
    assert.match(route, /MAX_REQUEST_SIZE = 16 \* 1024/u);
    assert.match(route, /questionRequestError\(parsedRequest\.reason/u);
  });

  test(`${endpoint} request parser rejects oversized JSON before parsing`, async () => {
    const result = await readQuestionRequest(
      request(JSON.stringify({ question: "x".repeat(MAX_BYTES) })),
      MAX_BYTES,
    );

    assert.deepEqual(result, { ok: false, reason: "too-large" });
  });

  test(`${endpoint} request parser rejects malformed JSON`, async () => {
    const result = await readQuestionRequest(request("{invalid"), MAX_BYTES);

    assert.deepEqual(result, { ok: false, reason: "invalid-json" });
  });

  test(`${endpoint} maps oversized and malformed requests to HTTP errors`, () => {
    const resource = endpoint === "answer" ? "question" : "search";
    assert.equal(questionRequestError("too-large", resource).status, 413);
    assert.equal(questionRequestError("invalid-json", resource).status, 400);
    assert.equal(questionRequestError("invalid-length", resource).status, 400);
  });
}

test("rejects malformed Content-Length", async () => {
  const result = await readQuestionRequest(
    request('{"question":"hello"}', "invalid"),
    MAX_BYTES,
  );

  assert.deepEqual(result, { ok: false, reason: "invalid-length" });
});

test("accepts bounded question JSON without Content-Length", async () => {
  const result = await readQuestionRequest(
    request('{"question":"hello"}'),
    MAX_BYTES,
  );

  assert.deepEqual(result, { ok: true, body: { question: "hello" } });
});

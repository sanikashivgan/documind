import assert from "node:assert/strict";
import test from "node:test";
import {
  InvalidContentLengthError,
  readLimitedRequestBody,
  RequestBodyTooLargeError,
} from "./request-body.ts";

const MAX_BYTES = 16;

function createRequest(body, contentLength) {
  const headers = new Headers();
  if (contentLength !== undefined) {
    headers.set("content-length", contentLength);
  }
  return new Request("http://localhost/upload", {
    method: "POST",
    headers,
    body,
  });
}

test("rejects oversized bodies even when Content-Length is absent", async () => {
  const request = createRequest("x".repeat(MAX_BYTES + 1));

  await assert.rejects(
    readLimitedRequestBody(request, MAX_BYTES),
    RequestBodyTooLargeError,
  );
});

test("accepts a bounded body when Content-Length is absent", async () => {
  const request = createRequest("small");

  assert.equal(
    new TextDecoder().decode(await readLimitedRequestBody(request, MAX_BYTES)),
    "small",
  );
});

test("parses multipart form data after bounding a body without Content-Length", async () => {
  const form = new FormData();
  form.append("file", new File(["document text"], "notes.txt", {
    type: "text/plain",
  }));
  const request = new Request("http://localhost/upload", {
    method: "POST",
    body: form,
  });
  const body = await readLimitedRequestBody(request, 1024);
  const boundedBody = new ArrayBuffer(body.byteLength);
  new Uint8Array(boundedBody).set(body);
  const boundedRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: boundedBody,
  });
  const parsedForm = await boundedRequest.formData();
  const file = parsedForm.get("file");

  assert.ok(file instanceof File);
  assert.equal(file.name, "notes.txt");
  assert.equal(await file.text(), "document text");
});

test("rejects malformed Content-Length headers", async () => {
  const request = createRequest("small", "not-a-number");

  await assert.rejects(
    readLimitedRequestBody(request, MAX_BYTES),
    InvalidContentLengthError,
  );
});

test("rejects a body that exceeds a misleading smaller Content-Length", async () => {
  const body = "x".repeat(MAX_BYTES + 1);
  const request = createRequest(body, "1");

  await assert.rejects(
    readLimitedRequestBody(request, MAX_BYTES),
    RequestBodyTooLargeError,
  );
});

test("rejects a body whose size does not match a valid Content-Length", async () => {
  const request = createRequest("small", "1");

  await assert.rejects(
    readLimitedRequestBody(request, MAX_BYTES),
    InvalidContentLengthError,
  );
});

test("rejects a declared length over the limit before reading the body", async () => {
  const request = createRequest("small", String(MAX_BYTES + 1));

  await assert.rejects(
    readLimitedRequestBody(request, MAX_BYTES),
    RequestBodyTooLargeError,
  );
});

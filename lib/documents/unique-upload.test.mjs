import assert from "node:assert/strict";
import test from "node:test";
import {
  createContentHash,
  uploadUniqueDocument,
} from "./unique-upload.ts";

const hash = (content) => createContentHash(new TextEncoder().encode(content));

test("computes a SHA-256 hash from the exact file bytes", () => {
  assert.equal(
    hash("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

function createHarness() {
  const documents = new Map();
  const storageObjects = new Set();
  let storageUploads = 0;
  let storageCleanups = 0;
  let extractionCount = 0;
  let nextId = 0;

  function key(userId, contentHash) {
    return `${userId}:${contentHash}`;
  }

  function createUpload(userId, content, filename) {
    const contentHash = hash(content);
    return uploadUniqueDocument({
      userId,
      contentHash,
      async findDuplicate(requestUserId, requestHash) {
        return {
          document: documents.get(key(requestUserId, requestHash)) ?? null,
          error: false,
        };
      },
      async prepare() {
        extractionCount += 1;
        return { content, filename };
      },
      async upload(prepared) {
        storageUploads += 1;
        const path = `${userId}/${storageUploads}`;
        storageObjects.add(path);
        return { path, error: false, prepared };
      },
      async insert(prepared, storagePath, requestUserId, requestHash) {
        const documentKey = key(requestUserId, requestHash);
        if (documents.has(documentKey)) {
          return { document: null, errorCode: "23505" };
        }

        const document = {
          id: `document-${++nextId}`,
          userId: requestUserId,
          contentHash: requestHash,
          name: prepared.filename,
          storagePath,
        };
        documents.set(documentKey, document);
        return { document };
      },
      async cleanup(path) {
        storageCleanups += 1;
        storageObjects.delete(path);
        return { error: false };
      },
    });
  }

  return {
    createUpload,
    documents,
    storageObjects,
    get stats() {
      return { storageUploads, storageCleanups, extractionCount };
    },
  };
}

test("identical content for one user returns the original without another upload", async () => {
  const harness = createHarness();
  const first = await harness.createUpload("user-a", "same file", "original.txt");
  const duplicate = await harness.createUpload("user-a", "same file", "renamed.txt");

  assert.equal(first.type, "created");
  assert.equal(duplicate.type, "duplicate");
  assert.equal(duplicate.document.id, first.document.id);
  assert.equal(duplicate.document.name, "original.txt");
  assert.deepEqual(harness.stats, {
    storageUploads: 1,
    storageCleanups: 0,
    extractionCount: 1,
  });
});

test("same filename with different content creates separate documents", async () => {
  const harness = createHarness();
  const first = await harness.createUpload("user-a", "content one", "notes.txt");
  const second = await harness.createUpload("user-a", "content two", "notes.txt");

  assert.equal(first.type, "created");
  assert.equal(second.type, "created");
  assert.notEqual(first.document.contentHash, second.document.contentHash);
  assert.equal(harness.stats.storageUploads, 2);
});

test("different users can independently upload identical content", async () => {
  const harness = createHarness();
  const first = await harness.createUpload("user-a", "shared content", "a.txt");
  const second = await harness.createUpload("user-b", "shared content", "b.txt");

  assert.equal(first.type, "created");
  assert.equal(second.type, "created");
  assert.notEqual(first.document.id, second.document.id);
  assert.equal(harness.stats.storageUploads, 2);
});

test("concurrent duplicate requests keep one record and clean the losing upload", async () => {
  const harness = createHarness();
  const results = await Promise.all([
    harness.createUpload("user-a", "race content", "first.txt"),
    harness.createUpload("user-a", "race content", "second.txt"),
  ]);

  assert.deepEqual(
    results.map(({ type }) => type).sort(),
    ["created", "duplicate"],
  );
  assert.equal(results[0].document.id, results[1].document.id);
  assert.equal(harness.stats.storageUploads, 2);
  assert.equal(harness.stats.storageCleanups, 1);
  assert.equal(harness.documents.size, 1);
  assert.equal(harness.storageObjects.size, 1);
});

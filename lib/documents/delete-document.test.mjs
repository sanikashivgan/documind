import assert from "node:assert/strict";
import test from "node:test";
import { deleteOwnedDocument } from "./delete-document.ts";

const userId = "user-123";
const documentId = "document-456";
const storagePath = `${userId}/file.pdf`;

function createOperations(overrides = {}) {
  const state = {
    document: { storagePath },
    storageExists: true,
    storageRemovals: 0,
    databaseDeletes: 0,
    ...overrides,
  };

  return {
    state,
    operations: {
      documentId,
      userId,
      async findOwnedDocument(requestedId, requestedUserId) {
        assert.equal(requestedId, documentId);
        assert.equal(requestedUserId, userId);
        return { document: state.document, error: false };
      },
      async removeStorageFile(path) {
        assert.equal(path, storagePath);
        state.storageRemovals += 1;
        state.storageExists = false;
        return { error: false };
      },
      async deleteOwnedRecord(requestedId, requestedUserId) {
        assert.equal(requestedId, documentId);
        assert.equal(requestedUserId, userId);
        state.databaseDeletes += 1;
        state.document = null;
        return { error: false };
      },
    },
  };
}

test("deletes the owned storage object and database record", async () => {
  const { state, operations } = createOperations();

  assert.deepEqual(await deleteOwnedDocument(operations), { type: "success" });
  assert.equal(state.storageExists, false);
  assert.equal(state.document, null);
  assert.equal(state.storageRemovals, 1);
  assert.equal(state.databaseDeletes, 1);
});

test("repeated deletion succeeds without repeating deletion of a missing row", async () => {
  const { state, operations } = createOperations();

  assert.deepEqual(await deleteOwnedDocument(operations), { type: "success" });
  assert.deepEqual(await deleteOwnedDocument(operations), { type: "success" });
  assert.equal(state.storageRemovals, 1);
  assert.equal(state.databaseDeletes, 1);
});

test("a missing storage object does not prevent deleting its record", async () => {
  const { state, operations } = createOperations({ storageExists: false });

  operations.removeStorageFile = async () => {
    state.storageRemovals += 1;
    return { error: false };
  };

  assert.deepEqual(await deleteOwnedDocument(operations), { type: "success" });
  assert.equal(state.document, null);
  assert.equal(state.databaseDeletes, 1);
});

test("database failure after storage removal is safe to retry", async () => {
  const { state, operations } = createOperations();
  operations.deleteOwnedRecord = async () => {
    state.databaseDeletes += 1;
    if (state.databaseDeletes === 1) return { error: true };
    state.document = null;
    return { error: false };
  };

  assert.deepEqual(await deleteOwnedDocument(operations), {
    type: "database-error",
  });
  assert.deepEqual(await deleteOwnedDocument(operations), { type: "success" });
  assert.equal(state.storageExists, false);
  assert.equal(state.document, null);
  assert.equal(state.storageRemovals, 2);
  assert.equal(state.databaseDeletes, 2);
});

test("storage failure preserves the database record for retry", async () => {
  const { state, operations } = createOperations();
  operations.removeStorageFile = async () => ({ error: true });

  assert.deepEqual(await deleteOwnedDocument(operations), {
    type: "storage-error",
  });
  assert.equal(state.document.storagePath, storagePath);
  assert.equal(state.databaseDeletes, 0);
});

test("a non-owned storage path is not removed", async () => {
  const { state, operations } = createOperations({
    document: { storagePath: "another-user/file.pdf" },
  });

  assert.deepEqual(await deleteOwnedDocument(operations), {
    type: "invalid-storage-path",
  });
  assert.equal(state.storageRemovals, 0);
  assert.equal(state.databaseDeletes, 0);
});

test("a missing or non-owned row is idempotent and does not touch storage", async () => {
  const { state, operations } = createOperations({ document: null });

  assert.deepEqual(await deleteOwnedDocument(operations), { type: "success" });
  assert.equal(state.storageRemovals, 0);
  assert.equal(state.databaseDeletes, 0);
});

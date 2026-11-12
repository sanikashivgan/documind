type OwnedDocument = {
  storagePath: string | null;
};

type DeleteOperationResult =
  | { type: "success" }
  | { type: "lookup-error" }
  | { type: "invalid-storage-path" }
  | { type: "storage-error" }
  | { type: "database-error" };

type DeleteDocumentOperations = {
  documentId: string;
  userId: string;
  findOwnedDocument: (
    documentId: string,
    userId: string,
  ) => Promise<{ document: OwnedDocument | null; error: boolean }>;
  removeStorageFile: (path: string) => Promise<{ error: boolean }>;
  deleteOwnedRecord: (
    documentId: string,
    userId: string,
  ) => Promise<{ error: boolean }>;
};

export async function deleteOwnedDocument({
  documentId,
  userId,
  findOwnedDocument,
  removeStorageFile,
  deleteOwnedRecord,
}: DeleteDocumentOperations): Promise<DeleteOperationResult> {
  let lookup: Awaited<ReturnType<typeof findOwnedDocument>>;
  try {
    lookup = await findOwnedDocument(documentId, userId);
  } catch {
    return { type: "lookup-error" };
  }

  if (lookup.error) {
    return { type: "lookup-error" };
  }

  // Missing (including non-owned) rows are already in the desired state.
  if (!lookup.document) {
    return { type: "success" };
  }

  const { storagePath } = lookup.document;
  if (
    typeof storagePath !== "string" ||
    !storagePath.startsWith(`${userId}/`)
  ) {
    return { type: "invalid-storage-path" };
  }

  try {
    const storageResult = await removeStorageFile(storagePath);
    if (storageResult.error) {
      return { type: "storage-error" };
    }
  } catch {
    return { type: "storage-error" };
  }

  try {
    const databaseResult = await deleteOwnedRecord(documentId, userId);
    if (databaseResult.error) {
      return { type: "database-error" };
    }
  } catch {
    return { type: "database-error" };
  }

  return { type: "success" };
}

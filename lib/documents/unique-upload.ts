import { createHash } from "node:crypto";

export function createContentHash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

export type DuplicateLookup<TDocument> = {
  document: TDocument | null;
  error: boolean;
};

export type UniqueUploadResult<TDocument> =
  | { type: "created"; document: TDocument }
  | { type: "duplicate"; document: TDocument }
  | { type: "preparation-error" }
  | { type: "lookup-error" }
  | { type: "upload-error" }
  | { type: "cleanup-error" }
  | { type: "database-error" };

type UniqueUploadOperations<TPrepared, TDocument> = {
  userId: string;
  contentHash: string;
  prepare: () => Promise<TPrepared>;
  findDuplicate: (
    userId: string,
    contentHash: string,
  ) => Promise<DuplicateLookup<TDocument>>;
  upload: (prepared: TPrepared) => Promise<{ path: string; error: boolean }>;
  insert: (
    prepared: TPrepared,
    storagePath: string,
    userId: string,
    contentHash: string,
  ) => Promise<{ document: TDocument | null; errorCode?: string }>;
  cleanup: (storagePath: string) => Promise<{ error: boolean }>;
};

export async function uploadUniqueDocument<TPrepared, TDocument>({
  userId,
  contentHash,
  prepare,
  findDuplicate,
  upload,
  insert,
  cleanup,
}: UniqueUploadOperations<TPrepared, TDocument>): Promise<
  UniqueUploadResult<TDocument>
> {
  let duplicateLookup: DuplicateLookup<TDocument>;
  try {
    duplicateLookup = await findDuplicate(userId, contentHash);
  } catch {
    return { type: "lookup-error" };
  }

  if (duplicateLookup.error) {
    return { type: "lookup-error" };
  }
  if (duplicateLookup.document) {
    return { type: "duplicate", document: duplicateLookup.document };
  }

  let prepared: TPrepared;
  try {
    prepared = await prepare();
  } catch {
    return { type: "preparation-error" };
  }

  let uploaded: Awaited<ReturnType<typeof upload>>;
  try {
    uploaded = await upload(prepared);
  } catch {
    return { type: "upload-error" };
  }
  if (uploaded.error) {
    return { type: "upload-error" };
  }

  let insertion: Awaited<ReturnType<typeof insert>>;
  try {
    insertion = await insert(prepared, uploaded.path, userId, contentHash);
  } catch {
    insertion = { document: null };
  }

  if (insertion.document) {
    return { type: "created", document: insertion.document };
  }

  try {
    const cleanupResult = await cleanup(uploaded.path);
    if (cleanupResult.error) return { type: "cleanup-error" };
  } catch {
    return { type: "cleanup-error" };
  }

  if (insertion.errorCode === "23505") {
    try {
      const concurrentDuplicate = await findDuplicate(userId, contentHash);
      if (concurrentDuplicate.error) return { type: "lookup-error" };
      if (concurrentDuplicate.document) {
        return { type: "duplicate", document: concurrentDuplicate.document };
      }
    } catch {
      return { type: "lookup-error" };
    }
  }

  return { type: "database-error" };
}

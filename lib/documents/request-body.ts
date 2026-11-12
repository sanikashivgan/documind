export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body exceeds the allowed size.");
    this.name = "RequestBodyTooLargeError";
  }
}

export class InvalidContentLengthError extends Error {
  constructor() {
    super("Content-Length is invalid or does not match the request body.");
    this.name = "InvalidContentLengthError";
  }
}

export type QuestionRequestResult =
  | { ok: true; body: unknown }
  | { ok: false; reason: "too-large" | "invalid-length" | "invalid-json" };

export function questionRequestError(
  reason: Exclude<QuestionRequestResult, { ok: true }>["reason"],
  endpoint: "question" | "search",
) {
  if (reason === "too-large") {
    return {
      status: 413,
      message: `The ${endpoint} request is too large.`,
    } as const;
  }
  if (reason === "invalid-length") {
    return {
      status: 400,
      message: `The ${endpoint} request has an invalid content length.`,
    } as const;
  }
  return {
    status: 400,
    message: `The ${endpoint} request could not be read.`,
  } as const;
}

export async function readQuestionRequest(
  request: Request,
  maxBytes: number,
): Promise<QuestionRequestResult> {
  try {
    const body = await readLimitedRequestBody(request, maxBytes);
    const text = new TextDecoder("utf-8", { fatal: true }).decode(body);
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return { ok: false, reason: "too-large" };
    }
    if (error instanceof InvalidContentLengthError) {
      return { ok: false, reason: "invalid-length" };
    }
    return { ok: false, reason: "invalid-json" };
  }
}

export async function readLimitedRequestBody(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array> {
  const contentLength = request.headers.get("content-length");
  let declaredLength: number | null = null;

  if (contentLength !== null) {
    if (!/^\d+$/u.test(contentLength)) {
      throw new InvalidContentLengthError();
    }

    declaredLength = Number(contentLength);
    if (!Number.isSafeInteger(declaredLength)) {
      throw new InvalidContentLengthError();
    }
    if (declaredLength > maxBytes) {
      throw new RequestBodyTooLargeError();
    }
  }

  if (!request.body) {
    if (declaredLength !== null && declaredLength !== 0) {
      throw new InvalidContentLengthError();
    }
    return new Uint8Array();
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } finally {
          throw new RequestBodyTooLargeError();
        }
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  if (declaredLength !== null && declaredLength !== totalBytes) {
    throw new InvalidContentLengthError();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body;
}

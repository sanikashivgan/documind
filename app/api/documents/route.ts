
import { Buffer } from "node:buffer";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { NextResponse, type NextRequest } from "next/server";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { formatPdfPages } from "@/lib/documents/pdf-extraction";
import {
  InvalidContentLengthError,
  readLimitedRequestBody,
  RequestBodyTooLargeError,
} from "@/lib/documents/request-body";
import {
  createDocumentSearchFilter,
  hasMoreDocuments,
  parseDocumentListParams,
} from "@/lib/documents/document-list";
import { createClient } from "@/lib/supabase/server";
import {
  createContentHash,
  uploadUniqueDocument,
} from "@/lib/documents/unique-upload";

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

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_REQUEST_SIZE = MAX_FILE_SIZE + 64 * 1024;

type SupportedType = "pdf" | "docx" | "txt";

function uploadError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getFileType(name: string): SupportedType | null {
  const extension = name.toLowerCase().split(".").pop();

  if (extension === "pdf") return "pdf";
  if (extension === "docx") return "docx";
  if (extension === "txt") return "txt";

  return null;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return uploadError(
      "Your session expired. Log in before loading documents.",
      401,
    );
  }

  const params = parseDocumentListParams(request.nextUrl.searchParams);
  if (!params) {
    return uploadError("The document list request is invalid.", 400);
  }

  let query = supabase
    .from("documents")
    .select("id, name, file_type, file_size, created_at", { count: "exact" })
    .eq("user_id", user.id);

  if (params.search) {
    query = query.or(createDocumentSearchFilter(params.search));
  }

  const { data: documents, count, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(params.offset, params.offset + params.limit - 1);

  if (error) {
    console.error("Document list query failed:", error.message);
    return uploadError("Your documents couldn’t be loaded. Please try again.", 500);
  }

  const totalCount = count ?? 0;
  return NextResponse.json({
    documents: documents ?? [],
    totalCount,
    hasMore: hasMoreDocuments(params.offset, documents?.length ?? 0, totalCount),
  });
}

async function extractText(
  type: SupportedType,
  bytes: Uint8Array,
): Promise<string> {
  if (type === "pdf") {
    const parser = new PDFParse({ data: bytes });

    try {
      const result = await parser.getText();
      if (result.pages.some((page) => page.text.trim())) {
        return formatPdfPages(result.pages, result.total).trim();
      }
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  if (type === "docx") {
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(bytes),
    });

    return result.value.trim();
  }

  return new TextDecoder("utf-8", { fatal: true })
    .decode(bytes)
    .replace(/^\uFEFF/, "")
    .trim();
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return uploadError(
      "Your session expired. Log in before uploading.",
      401,
    );
  }

  let body: Uint8Array;

  try {
    body = await readLimitedRequestBody(request, MAX_REQUEST_SIZE);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return uploadError("Files must be 10 MB or smaller.", 413);
    }
    if (error instanceof InvalidContentLengthError) {
      return uploadError("The upload request has an invalid content length.", 400);
    }
    return uploadError("The upload request could not be read.", 400);
  }

  let formData: FormData;
  try {
    const boundedBody = new ArrayBuffer(body.byteLength);
    new Uint8Array(boundedBody).set(body);
    const boundedRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: boundedBody,
    });
    formData = await boundedRequest.formData();
  } catch {
    return uploadError("The upload request could not be read.", 400);
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return uploadError("Choose a PDF, DOCX, or TXT file.", 400);
  }

  const fileType = getFileType(file.name);

  if (!fileType) {
    return uploadError(
      "Unsupported format. Choose a PDF, DOCX, or TXT file.",
      415,
    );
  }

  if (file.size === 0) {
    return uploadError("The selected file is empty.", 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return uploadError("Files must be 10 MB or smaller.", 413);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (
    fileType === "pdf" &&
    new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-"
  ) {
    return uploadError("The selected file is not a valid PDF.", 415);
  }

  if (
    fileType === "docx" &&
    !(bytes[0] === 0x50 && bytes[1] === 0x4b)
  ) {
    return uploadError("The selected file is not a valid DOCX archive.", 415);
  }

  const contentType =
    fileType === "pdf"
      ? "application/pdf"
      : fileType === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "text/plain";

  const contentHash = createContentHash(bytes);
  let extractionError: unknown;
  const result = await uploadUniqueDocument({
    userId: user.id,
    contentHash,
    async findDuplicate(userId, hash) {
      const { data, error } = await supabase
        .from("documents")
        .select("id, name, file_type, file_size, processing_status, created_at")
        .eq("user_id", userId)
        .eq("content_hash", hash)
        .maybeSingle();
      return { document: data, error: Boolean(error) };
    },
    async prepare() {
      let extractedText: string;
      try {
        extractedText = await extractText(fileType, bytes);
      } catch (error) {
        extractionError = error;
        throw error;
      }

      if (!extractedText) {
        throw new Error("No readable text was found in this file.");
      }

      return extractedText;
    },
    async upload() {
      const path = `${user.id}/${crypto.randomUUID()}.${fileType}`;
      const { data, error } = await supabase.storage
        .from("documents")
        .upload(path, file, {
          cacheControl: "3600",
          contentType,
          upsert: false,
        });
      return { path: data?.path ?? path, error: Boolean(error) };
    },
    async insert(extractedText, storagePath, userId, hash) {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: userId,
          name: file.name,
          storage_path: storagePath,
          file_type: fileType,
          file_size: file.size,
          content_hash: hash,
          extracted_text: extractedText,
          processing_status: "processed",
        })
        .select("id, name, file_type, file_size, processing_status, created_at")
        .single();

      return { document: data, errorCode: error?.code };
    },
    async cleanup(storagePath) {
      const { error } = await supabase.storage
        .from("documents")
        .remove([storagePath]);
      if (error) {
        console.error("Uploaded file cleanup failed:", error.message);
      }
      return { error: Boolean(error) };
    },
  });

  if (result.type === "duplicate") {
    return NextResponse.json(
      {
        duplicate: true,
        document: result.document,
        error: "This file is already in your document library.",
        message: "This file is already in your document library.",
      },
      { status: 409 },
    );
  }

  if (result.type === "preparation-error") {
    if (extractionError) {
      console.error("Document text extraction error:", extractionError);
      return uploadError(
        "We couldn't read this file. Check the server terminal for details.",
        422,
      );
    }
    return uploadError("No readable text was found in this file.", 422);
  }

  if (result.type !== "created") {
    const messages = {
      "lookup-error": "Could not check whether this file is already uploaded.",
      "upload-error": "File storage failed. Please try again.",
      "cleanup-error": "The upload could not be saved or safely cleaned up. Please contact support.",
      "database-error": "The document could not be saved. Please try again.",
    } as const;
    console.error("Document upload failed:", result.type);
    return uploadError(messages[result.type], 500);
  }

  return NextResponse.json(
    {
      document: result.document,
      message: "Document uploaded and text extracted successfully.",
    },
    { status: 201 },
  );
}

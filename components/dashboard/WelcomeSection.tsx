"use client";

import Link from "next/link";
import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type UploadNotice = {
  type: "success" | "error";
  message: string;
  loginRequired?: boolean;
};

type UploadResponse = {
  error?: string;
  name?: string;
};

export default function WelcomeSection() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [notice, setNotice] = useState<UploadNotice | null>(null);

  function handleFile(file?: File) {
    if (!file) return;

    if (!/\.(pdf|docx|txt)$/i.test(file.name)) {
      setNotice({
        type: "error",
        message: "Choose a PDF, DOCX, or TXT file to upload.",
      });
      return;
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      setNotice({
        type: "error",
        message:
          file.size === 0
            ? "The selected file is empty. Choose a different file."
            : "Files must be 10 MB or smaller.",
      });
      return;
    }

    uploadFile(file);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    handleFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragActive(false);

    if (!uploading) {
      handleFile(event.dataTransfer.files[0]);
    }
  }

  function uploadFile(file: File) {
    setNotice(null);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/documents");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        setProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    });
    request.upload.addEventListener("load", () => setProgress(100));
    request.addEventListener("load", () => {
      let response: UploadResponse = {};
      try {
        response = JSON.parse(request.responseText) as UploadResponse;
      } catch {
        response = {};
      }

      if (request.status >= 200 && request.status < 300) {
        setNotice({
          type: "success",
          message: `${file.name} uploaded to your private documents.`,
        });
        router.refresh();
      } else {
        setNotice({
          type: "error",
          message: response.error ?? "Upload failed. Please try again.",
          loginRequired: request.status === 401,
        });
      }

      setUploading(false);
      setProgress(null);
    });
    request.addEventListener("error", () => {
      setNotice({
        type: "error",
        message: "Could not reach the server. Check your connection and try again.",
      });
      setUploading(false);
      setProgress(null);
    });
    request.send(formData);
  }

  return (
    <section
      className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_50px_-40px_rgba(15,23,42,0.3)]"
      aria-labelledby="welcome-heading"
      aria-busy={uploading}
    >
      <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" aria-hidden="true" />
            Your workspace
          </p>
          <h2
            id="welcome-heading"
            className="max-w-lg text-2xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 sm:text-[2rem]"
          >
            Make every document easier to understand.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-[15px]">
            Keep your files in one private place. Find important passages and
            ask questions without searching page by page.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="m3.25 8.25 3 3 6.5-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Private by default
            </span>
            <span className="inline-flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2v8m0 0 3-3m-3 3L5 7m-2.25 5.25v1.5h10.5v-1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              PDF, DOCX, and TXT
            </span>
          </div>
        </div>

        <div className="border-t border-slate-200/80 bg-slate-50/70 p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-7">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setDragActive(false);
              }
            }}
            onDrop={handleDrop}
            disabled={uploading}
            className={[
              "group flex min-h-48 w-full flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-6 text-center transition duration-200 focus-visible:outline-offset-4",
              dragActive
                ? "border-teal-600 bg-teal-50"
                : "border-slate-300 bg-white hover:border-teal-400 hover:bg-teal-50/40",
              "disabled:cursor-wait disabled:opacity-70",
            ].join(" ")}
            aria-label="Choose a PDF, DOCX, or TXT document, or drop it here"
          >
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-100">
              <svg width="21" height="21" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 13V3.5m0 0L6.5 7M10 3.5 13.5 7M4 12.5v3A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {uploading ? "Uploading your document…" : "Drop a file here to get started"}
            </span>
            <span className="mt-1.5 text-xs text-slate-500">
              or <span className="font-semibold text-teal-700">browse files</span> · PDF, DOCX, TXT · max 10 MB
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
            aria-label="Choose a PDF, DOCX, or TXT file"
          />
        </div>
      </div>
      {uploading && progress !== null ? (
        <div className="border-t border-slate-100 bg-white px-5 py-4 sm:px-7" aria-live="polite">
          <div
            className="h-2 max-w-xl overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Document upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="h-full rounded-full bg-teal-600 transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">
            {progress === 100
              ? "Saving to your private documents..."
              : `Uploading file... ${progress}%`}
          </p>
        </div>
      ) : null}
      {notice ? (
        <p
          className={`border-t px-5 py-4 text-sm sm:px-7 ${
            notice.type === "error"
              ? "border-red-100 bg-red-50/50 text-red-700"
              : "border-emerald-100 bg-emerald-50/50 text-emerald-800"
          }`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          {notice.message}{" "}
          {notice.loginRequired ? (
            <Link href="/login" className="font-medium underline">
              Log in
            </Link>
          ) : null}
        </p>
      ) : (
        <p className="border-t border-slate-100 bg-white px-5 py-3 text-xs text-slate-500 sm:px-7">
          PDF, DOCX, and TXT files up to 10 MB are stored privately in your account.
        </p>
      )}
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DocumentReader from "@/components/documents/DocumentReader";
import DocumentQuestionSearch from "@/components/documents/DocumentQuestionSearch";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Read Document — DocuMind",
  description: "Read an uploaded document, search its text, and ask questions.",
};

function formatUploadDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(Date.parse(date));
}

export default async function DocumentPage({
  params,
}: PageProps<"/documents/[id]">) {
  return (
    <Suspense fallback={<DocumentLoading />}>
      <AuthenticatedDocument params={params} />
    </Suspense>
  );
}

function DocumentLoading() {
  return (
    <main
      className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8"
      aria-label="Loading document"
      role="status"
      aria-busy="true"
    >
      <div className="mx-auto max-w-5xl animate-pulse space-y-6">
        <p className="sr-only">Loading document content…</p>
        <div className="h-24 rounded-xl border border-border bg-surface" />
        <div className="h-48 rounded-xl border border-border bg-surface" />
        <div className="h-96 rounded-xl border border-border bg-surface" />
      </div>
    </main>
  );
}

async function AuthenticatedDocument({
  params,
}: {
  params: PageProps<"/documents/[id]">["params"];
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, name, file_type, created_at, extracted_text")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Document detail query failed:", error.message);

    return (
      <DashboardShell title="Document" email={user.email}>
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-200 bg-white p-6 sm:p-8">
          <div role="alert" aria-live="assertive">
            <h2 className="text-base font-semibold text-foreground">
              Document couldn’t be loaded
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              There was a problem retrieving this document. Please try again.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-accent hover:bg-teal-50 hover:text-teal-800"
          >
            Back to dashboard
          </Link>
        </div>
      </DashboardShell>
    );
  }

  if (!document) {
    notFound();
  }

  return (
    <DashboardShell title="Read Document" email={user.email}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-7 sm:gap-8">
        <Link
          href="/dashboard#documents"
          className="inline-flex w-fit items-center gap-2 rounded-md text-sm font-medium text-slate-600 transition-colors hover:text-accent"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3.5 5.5 8 10 12.5M6 8h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to documents
        </Link>

        <header className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_30px_-24px_rgba(15,54,55,0.35)] sm:p-7">
          <div className="flex flex-wrap items-start gap-3">
            <span className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-[10px] font-bold tracking-wide text-teal-800">
              {document.file_type.toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="break-words text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">
                {document.name}
              </h2>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
                Added {formatUploadDate(document.created_at)}
              </p>
            </div>
          </div>
        </header>

        <DocumentQuestionSearch documentId={document.id} />

        <section
          className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_36px_-30px_rgba(15,54,55,0.3)]"
          aria-labelledby="document-text-heading"
        >
          <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              Reader
            </p>
            <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
              <h2
                id="document-text-heading"
                className="text-base font-semibold tracking-tight text-slate-900"
              >
                Document text
              </h2>
              <p className="text-sm text-slate-500">
                Extracted text from your uploaded file
              </p>
            </div>
          </div>
          {document.extracted_text.trim() ? (
            <div className="bg-slate-50/70 px-3 py-4 sm:px-8 sm:py-9">
              <DocumentReader text={document.extracted_text} />
            </div>
          ) : (
            <div
              className="px-5 py-12 text-center sm:px-6 sm:py-16"
              role="status"
              aria-live="polite"
            >
              <p className="text-sm font-semibold text-slate-700">
                No readable text is available
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                This file may contain scanned pages or content that could not be
                extracted. You can still return to your document library.
              </p>
              <Link
                href="/dashboard#documents"
                className="mt-4 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-accent hover:bg-teal-50 hover:text-teal-800"
              >
                Back to documents
              </Link>
            </div>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

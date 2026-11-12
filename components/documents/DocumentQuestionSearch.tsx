"use client";

import { useState, type FormEvent } from "react";

type SearchResult = {
  passage: string;
  sectionTitle: string | null;
  pageNumber: number | null;
  matchedTerms: number;
  totalTerms: number;
};

type SearchResponse = {
  error?: string;
  results?: SearchResult[];
};

type AnswerResponse = {
  error?: string;
  answer?: string;
  sources?: Array<{
    passage: string;
    sectionTitle: string | null;
    pageNumber: number | null;
  }>;
};

type DocumentQuestionSearchProps = {
  documentId: string;
};

export default function DocumentQuestionSearch({
  documentId,
}: DocumentQuestionSearchProps) {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [pendingMode, setPendingMode] = useState<"ai" | "search" | null>(null);
  const [error, setError] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [answer, setAnswer] = useState<AnswerResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runExtractiveSearch();
  }

  async function runExtractiveSearch() {
    const query = question.trim();

    if (!query) {
      setError("Enter a question or search phrase.");
      setAnswerError("");
      setResults(null);
      setAnswer(null);
      return;
    }

    setPending(true);
    setPendingMode("search");
    setError("");
    setAnswerError("");
    setResults(null);
    setAnswer(null);

    try {
      const response = await fetch(
        `/api/documents/${encodeURIComponent(documentId)}/search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: query }),
        },
      );
      const data = (await response.json()) as SearchResponse;

      if (!response.ok) {
        setError(data.error ?? "Search failed. Please try again.");
        return;
      }

      setResults(data.results ?? []);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
      setPendingMode(null);
    }
  }

  async function runAiAnswer() {
    const query = question.trim();

    if (!query) {
      setAnswerError("Enter a question before asking AI.");
      setError("");
      setResults(null);
      setAnswer(null);
      return;
    }

    setPending(true);
    setPendingMode("ai");
    setAnswerError("");
    setError("");
    setResults(null);
    setAnswer(null);

    try {
      const response = await fetch(
        `/api/documents/${encodeURIComponent(documentId)}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: query }),
        },
      );
      const data = (await response.json()) as AnswerResponse;

      if (!response.ok) {
        setAnswerError(data.error ?? "Could not answer this question. Please try again.");
        return;
      }

      setAnswer(data);
    } catch {
      setAnswerError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
      setPendingMode(null);
    }
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_8px_30px_-24px_rgba(15,54,55,0.35)]"
      aria-labelledby="question-search-heading"
    >
      <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent" aria-hidden="true">
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
              <path d="m9 1.75 1.65 5.3L16 8.7l-5.35 1.65L9 15.75l-1.65-5.4L2 8.7l5.35-1.65L9 1.75Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
          <h2
            id="question-search-heading"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            Ask or search this document
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-5 text-muted">
            Get a grounded answer or find matching passages in the extracted text.
          </p>
          </div>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50/70 px-2.5 py-1 text-[11px] font-medium text-teal-800">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 1.5 9.5 2.75v2.6c0 2.15-1.45 3.9-3.5 4.85-2.05-.95-3.5-2.7-3.5-4.85v-2.6L6 1.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
          </svg>
          Uses this document only
        </span>
      </div>

      <form
        className="flex flex-col gap-2.5 p-5 sm:flex-row sm:p-6"
        onSubmit={handleSubmit}
      >
        <label className="sr-only" htmlFor="document-question">
          Question or search phrase
        </label>
        <input
          id="document-question"
          type="search"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={500}
          placeholder="e.g. What does the document say about refunds?"
          className="form-field min-w-0 flex-1"
          aria-describedby="document-question-help"
        />
        <button
          type="submit"
          disabled={pending}
          className="secondary-button px-4"
        >
          {pendingMode === "search" ? "Searching..." : "Search passages"}
        </button>
        <button
          type="button"
          onClick={runAiAnswer}
          disabled={pending}
          className="primary-button px-5"
        >
          {pendingMode === "ai" ? "Thinking..." : "Ask AI"}
        </button>
      </form>
      <p id="document-question-help" className="px-5 pb-5 text-xs leading-5 text-muted sm:px-6 sm:pb-6">
        Search finds exact matching passages. Ask AI for a concise response based
        on relevant text from this file.
      </p>

      {pending ? (
        <p         className="mx-5 mb-5 rounded-lg bg-slate-50 px-3.5 py-3 text-sm text-muted sm:mx-6" role="status" aria-live="polite">
          {pendingMode === "ai"
            ? "Preparing a grounded answer from this document..."
            : "Searching this document..."}
        </p>
      ) : null}

      {error ? (
        <p className="mx-5 mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 sm:mx-6" role="alert">
          {error}
        </p>
      ) : null}

      {answerError ? (
        <p className="mx-5 mb-5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 sm:mx-6" role="alert">
          {answerError}
        </p>
      ) : null}

      {answer ? (
        <section
          className="mx-5 mb-5 rounded-xl border border-teal-100 bg-teal-50/60 p-4 sm:mx-6 sm:p-5"
          aria-labelledby="document-answer-heading"
          aria-live="polite"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3
              id="document-answer-heading"
              className="text-sm font-semibold text-foreground"
            >
              AI answer
            </h3>
            <span className="rounded-md border border-accent/20 bg-white px-2 py-1 text-xs font-medium text-accent">
              Based only on this document
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {answer.answer}
          </p>
          {answer.sources && answer.sources.length > 0 ? (
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Supporting source excerpts
              </h4>
              {answer.sources.map((source, index) => (
                <blockquote
                  key={`${index}-${source.passage.slice(0, 40)}`}
                  className="rounded-lg border-l-4 border-accent bg-white px-4 py-3"
                >
                  {source.sectionTitle || source.pageNumber ? (
                    <p className="mb-1.5 text-xs font-semibold text-accent">
                      {source.sectionTitle}
                      {source.pageNumber ? ` · Page ${source.pageNumber}` : ""}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                    {source.passage}
                  </p>
                </blockquote>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted">
              No supporting passage was found, so the answer is marked as
              unsupported.
            </p>
          )}
        </section>
      ) : null}

      {results && results.length === 0 ? (
        <p         className="mx-5 mb-5 rounded-lg border border-border bg-slate-50 px-3.5 py-3 text-sm text-muted sm:mx-6" role="status">
          No matching passages were found in this document. Try different keywords.
        </p>
      ) : null}

      {results && results.length > 0 ? (
        <div className="mx-5 mb-5 space-y-3 sm:mx-6" aria-live="polite">
          <h3 className="text-sm font-semibold text-foreground">
            Matching source passages
          </h3>
          {results.map((result, index) => (
            <blockquote
              key={`${index}-${result.passage.slice(0, 40)}`}
              className="rounded-xl border border-border border-l-4 border-l-accent bg-slate-50/70 px-4 py-3"
            >
              {result.sectionTitle || result.pageNumber ? (
                <p className="mb-1.5 text-xs font-semibold text-accent">
                  {result.sectionTitle}
                  {result.pageNumber ? ` · Page ${result.pageNumber}` : ""}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                {result.passage}
              </p>
              <footer className="mt-2 text-xs text-muted">
                Source excerpt · {result.matchedTerms} of {result.totalTerms}{" "}
                search terms matched
              </footer>
            </blockquote>
          ))}
        </div>
      ) : null}
    </section>
  );
}

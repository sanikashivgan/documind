"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_DOCUMENT_PAGE_SIZE } from "@/lib/documents/document-list";

type DocumentRecord = {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  created_at: string;
};

type RecentDocumentsProps = {
  documents: DocumentRecord[];
  totalCount: number;
  hasMore: boolean;
  error?: boolean;
};

type DocumentPage = {
  documents: DocumentRecord[];
  totalCount: number;
  hasMore: boolean;
};

type DocumentListResponse = {
  documents?: DocumentRecord[];
  totalCount?: number;
  hasMore?: boolean;
  error?: string;
};

type SearchResultPage = {
  query: string;
  page: DocumentPage;
};

type SearchStatus = {
  query: string;
  error?: string;
};

type DocumentPageState = {
  key: string;
  page: DocumentPage;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatUploadDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default function RecentDocuments({
  documents,
  totalCount,
  hasMore,
  error = false,
}: RecentDocumentsProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const initialPage: DocumentPage = { documents, totalCount, hasMore };
  const initialPageKey = `${totalCount}-${documents
    .map(({ id }) => id)
    .join(",")}`;
  const [pageState, setPageState] = useState<DocumentPageState>(() => ({
    key: initialPageKey,
    page: initialPage,
  }));
  const [searchRevision, setSearchRevision] = useState(0);
  const [searchResult, setSearchResult] = useState<SearchResultPage | null>(
    null,
  );
  const [searchStatus, setSearchStatus] = useState<SearchStatus | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState("");
  const [deletedDocumentIds, setDeletedDocumentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const successMessageRef = useRef<HTMLParagraphElement>(null);

  const trimmedSearch = search.trim();
  const page =
    pageState.key === initialPageKey ? pageState.page : initialPage;
  const activePage = trimmedSearch
    ? searchResult?.query === trimmedSearch
      ? searchResult.page
      : null
    : page;
  const searching =
    Boolean(trimmedSearch) &&
    searchResult?.query !== trimmedSearch &&
    searchStatus?.query !== trimmedSearch;
  const searchError =
    searchStatus?.query === trimmedSearch ? searchStatus.error : undefined;
  const visibleDocuments = (activePage?.documents ?? []).filter(
    (doc) => !deletedDocumentIds.has(doc.id),
  );

  useEffect(() => {
    if (!trimmedSearch) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const query = new URLSearchParams({
          offset: "0",
          limit: String(DEFAULT_DOCUMENT_PAGE_SIZE),
          search: trimmedSearch,
        });
        const response = await fetch(`/api/documents?${query}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as DocumentListResponse;
        if (controller.signal.aborted) return;

        if (!response.ok) {
          throw new Error(data.error ?? "Could not search documents.");
        }

        setSearchResult({
          query: trimmedSearch,
          page: {
            documents: data.documents ?? [],
            totalCount: data.totalCount ?? 0,
            hasMore: data.hasMore ?? false,
          },
        });
        setSearchStatus({ query: trimmedSearch });
      } catch {
        if (!controller.signal.aborted) {
          setSearchStatus({
            query: trimmedSearch,
            error: "Documents couldn’t be searched. Please try again.",
          });
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [searchRevision, trimmedSearch]);

  async function loadMore() {
    if (!activePage?.hasMore || loadingMore) return;

    setLoadingMore(true);
    setLoadMoreError("");
    const searchTerm = trimmedSearch;
    const query = new URLSearchParams({
      offset: String(activePage.documents.length),
      limit: String(DEFAULT_DOCUMENT_PAGE_SIZE),
      ...(searchTerm ? { search: searchTerm } : {}),
    });

    try {
      const response = await fetch(`/api/documents?${query}`);
      const data = (await response.json()) as DocumentListResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load more documents.");
      }

      const nextPage = {
        documents: data.documents ?? [],
        totalCount: data.totalCount ?? 0,
        hasMore: data.hasMore ?? false,
      };

      if (searchTerm) {
        setSearchResult((current) =>
          current?.query === searchTerm
            ? {
                query: searchTerm,
                page: {
                  ...nextPage,
                  documents: [
                    ...current.page.documents,
                    ...nextPage.documents,
                  ],
                },
              }
            : current,
        );
      } else {
        setPageState((current) => {
          const currentPage =
            current.key === initialPageKey ? current.page : initialPage;
          return {
            key: initialPageKey,
            page: {
              ...nextPage,
              documents: [...currentPage.documents, ...nextPage.documents],
            },
          };
        });
      }
    } catch {
      setLoadMoreError("More documents couldn’t be loaded. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (selectedDocument && !dialog.open) {
      dialog.showModal();
      cancelButtonRef.current?.focus();
    } else if (!selectedDocument && dialog.open) {
      dialog.close();
    }
  }, [selectedDocument]);

  useEffect(() => {
    if (successMessage) successMessageRef.current?.focus();
  }, [successMessage]);

  function closeDeleteDialog() {
    if (deletingId) return;
    setDeleteError("");
    setSelectedDocument(null);
  }

  async function confirmDelete() {
    if (!selectedDocument || deletingId) return;

    const document = selectedDocument;
    setDeletingId(document.id);
    setDeleteError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/documents/${encodeURIComponent(document.id)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        setDeleteError(
          "Could not confirm deletion. This document is still shown here. Please try again or contact support.",
        );
        return;
      }

      setDeletedDocumentIds((previous) => {
        const next = new Set(previous);
        next.add(document.id);
        return next;
      });
      setSuccessMessage(`“${document.name}” was deleted.`);
      setSelectedDocument(null);
      if (trimmedSearch) {
        setSearchResult(null);
        setSearchStatus(null);
        setSearchRevision((revision) => revision + 1);
      }
      router.refresh();
    } catch {
      setDeleteError(
        "Could not reach the server, so deletion was not confirmed. This document is still shown here. Check your connection and try again.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section
      id="documents"
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_44px_-36px_rgba(15,23,42,0.35)]"
      aria-labelledby="recent-docs-heading"
    >
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2
            id="recent-docs-heading"
            className="text-base font-semibold tracking-tight text-slate-900"
          >
            Your documents
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {trimmedSearch
              ? `${activePage?.totalCount ?? 0} matching documents`
              : `${page.totalCount} documents, newest first`}
          </p>
        </div>
        <div className="relative w-full sm:max-w-[17rem]">
          <label className="sr-only" htmlFor="recent-document-search">
            Search documents
          </label>
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="8.75" cy="8.75" r="5.75" stroke="currentColor" strokeWidth="1.5" />
            <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            id="recent-document-search"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setSearchResult(null);
              setSearchStatus(null);
              setLoadMoreError("");
            }}
            maxLength={100}
            placeholder="Search all documents"
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-600/10"
          />
        </div>
      </div>

      {successMessage ? (
        <p
          ref={successMessageRef}
          className="border-b border-emerald-100 bg-emerald-50/70 px-5 py-3 text-sm font-medium text-emerald-800 sm:px-6"
          role="status"
          tabIndex={-1}
        >
          {successMessage}
        </p>
      ) : null}

      {error ? (
        <div
          className="px-5 py-10 text-center text-sm text-red-700 sm:px-6"
          role="alert"
        >
          Your documents couldn’t be loaded. Refresh the page to try again.
        </div>
      ) : searching ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500" role="status" aria-busy="true">
          Searching your documents…
        </div>
      ) : searchError ? (
        <div className="px-5 py-10 text-center text-sm text-red-700" role="alert">
          {searchError}
        </div>
      ) : visibleDocuments.length === 0 && !trimmedSearch ? (
        <EmptyDocuments />
      ) : visibleDocuments.length === 0 ? (
        <div className="px-5 py-12 text-center sm:px-6" role="status">
          <p className="text-sm font-medium text-slate-900">
            {trimmedSearch
              ? `No documents match “${trimmedSearch}”`
              : "No documents are available."}
          </p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="mt-2 rounded-lg px-2 py-1 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 hover:text-teal-900 focus-visible:outline-offset-2"
          >
            Clear search
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100" role="list">
          {visibleDocuments.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-teal-50 text-[10px] font-bold tracking-wide text-teal-800"
                  aria-hidden="true"
                >
                  {doc.file_type.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <Link
                    href={`/documents/${encodeURIComponent(doc.id)}`}
                    className="block truncate text-sm font-semibold text-slate-900 transition-colors hover:text-teal-800 focus-visible:rounded-sm"
                  >
                    {doc.name}
                  </Link>
                  <p className="mt-1 text-xs text-slate-500">
                    {doc.file_type.toUpperCase()} · Uploaded{" "}
                    {formatUploadDate(doc.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 pl-[3.25rem] sm:pl-0">
                <span className="text-xs text-slate-500">
                  {formatFileSize(doc.file_size)}
                </span>
                <Link
                  href={`/documents/${encodeURIComponent(doc.id)}`}
                  className="inline-flex min-h-9 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50/60 hover:text-teal-800 focus-visible:outline-offset-2"
                >
                  Read
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError("");
                    setSelectedDocument(doc);
                  }}
                  disabled={deletingId !== null}
                  aria-label={`Delete ${doc.name}`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === doc.id ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
                        <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Deleting…
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M2.75 4.25h10.5M6.25 4.25V2.75h3.5v1.5m2.5 0-.5 9H4.25l-.5-9m3 2.5v4m2.5-4v4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Delete
                    </>
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!error && !searching && !searchError && activePage?.hasMore ? (
        <div className="border-t border-slate-100 px-5 py-4 text-center">
          {loadMoreError ? (
            <p className="mb-3 text-sm text-red-700" role="alert">
              {loadMoreError}
            </p>
          ) : null}
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="secondary-button w-full sm:w-auto"
          >
            {loadingMore ? "Loading documents…" : "Load more"}
          </button>
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-document-title"
        aria-describedby="delete-document-description"
        aria-modal="true"
        onCancel={(event) => {
          event.preventDefault();
          closeDeleteDialog();
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDeleteDialog();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/40"
      >
        {selectedDocument ? (
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-100">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M3.5 5.25h13M7.25 5.25v-2h5.5v2m3.25 0-.75 11.5h-9.5L5 5.25m4 3v5m3-5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="min-w-0">
                <h3
                  id="delete-document-title"
                  className="text-base font-semibold tracking-tight text-slate-900"
                >
                  Delete this document?
                </h3>
                <p
                  id="delete-document-description"
                  className="mt-2 text-sm leading-6 text-slate-600"
                >
                  You are about to permanently delete{" "}
                  <span className="break-words font-semibold text-slate-900">
                    {selectedDocument.name}
                  </span>
                  . This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteError ? (
              <p
                className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-800"
                role="alert"
              >
                {deleteError}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={closeDeleteDialog}
                disabled={deletingId !== null}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingId !== null}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                {deletingId === selectedDocument.id ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}

function EmptyDocuments() {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center sm:py-16">
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-700"
        aria-hidden="true"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M7 3h5l5 5v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M12 3v5h5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-slate-900">Your library is ready</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Upload your first PDF, DOCX, or TXT file to see it here and start asking
        questions about what matters.
      </p>
    </div>
  );
}

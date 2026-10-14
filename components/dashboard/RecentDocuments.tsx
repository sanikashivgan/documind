type DemoDocument = {
  id: string;
  name: string;
  uploadedAt: string;
  size: string;
  pages: number;
};

const demoDocuments: DemoDocument[] = [
  {
    id: "1",
    name: "Q3-Product-Strategy.pdf",
    uploadedAt: "Oct 12, 2026",
    size: "2.4 MB",
    pages: 28,
  },
  {
    id: "2",
    name: "Employee-Handbook-2026.pdf",
    uploadedAt: "Oct 10, 2026",
    size: "1.8 MB",
    pages: 64,
  },
  {
    id: "3",
    name: "Vendor-Contract-Acme.pdf",
    uploadedAt: "Oct 8, 2026",
    size: "890 KB",
    pages: 12,
  },
  {
    id: "4",
    name: "Research-Notes-LLM-RAG.pdf",
    uploadedAt: "Oct 5, 2026",
    size: "3.1 MB",
    pages: 41,
  },
];

export default function RecentDocuments() {
  return (
    <section
      id="documents"
      className="rounded-xl border border-border bg-surface"
      aria-labelledby="recent-docs-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2
            id="recent-docs-heading"
            className="text-base font-semibold text-foreground"
          >
            Recent Documents
          </h2>
          <p className="mt-1 text-sm text-muted">
            Sample PDFs for UI preview — not stored on a server.
          </p>
        </div>
        <span className="rounded-md border border-border bg-slate-50 px-2 py-1 text-xs text-muted">
          Demo data
        </span>
      </div>

      {demoDocuments.length === 0 ? (
        <EmptyDocuments />
      ) : (
        <ul className="divide-y divide-border" role="list">
          {demoDocuments.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-slate-50 text-xs font-semibold text-slate-600"
                  aria-hidden="true"
                >
                  PDF
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {doc.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {doc.pages} pages · Uploaded {doc.uploadedAt}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 pl-13 sm:pl-0">
                <span className="text-xs text-muted">{doc.size}</span>
                <button
                  type="button"
                  disabled
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-slate-400"
                  title="Opening documents will be available in a later milestone"
                >
                  Open
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyDocuments() {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-slate-500"
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
      <h3 className="text-sm font-semibold text-foreground">No documents yet</h3>
      <p className="mt-2 max-w-sm text-sm text-muted">
        When you upload PDFs, they will appear here so you can ask questions and
        revisit past files.
      </p>
    </div>
  );
}

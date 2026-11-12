type SummaryCardsProps = {
  documentCount: number | null;
};

export default function SummaryCards({ documentCount }: SummaryCardsProps) {
  return (
    <section aria-labelledby="summary-heading">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2
          id="summary-heading"
          className="text-sm font-semibold tracking-tight text-slate-900"
        >
          Your library
        </h2>
        <span className="text-xs text-slate-500">A quick look at your workspace</span>
      </div>

      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_36px_-32px_rgba(15,23,42,0.35)] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M6.5 3h6l5 5v10.25A1.75 1.75 0 0 1 15.75 20h-9.5A1.75 1.75 0 0 1 4.5 18.25V4.75A1.75 1.75 0 0 1 6.25 3h.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M12.5 3v5h5M8 12h6M8 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total documents
            </p>
            {documentCount === null ? (
              <p className="mt-1 text-sm font-medium text-red-700" role="status">
                Document count unavailable
              </p>
            ) : (
              <p className="mt-0.5 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
                {documentCount.toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5 border-t border-slate-100 pt-4 text-xs font-medium text-slate-600 sm:border-l sm:border-t-0 sm:py-2 sm:pl-5 sm:pr-2">
          <span className="h-2 w-2 rounded-full bg-teal-600 ring-4 ring-teal-50" aria-hidden="true" />
          Your document library is private to your account
        </div>
      </div>
    </section>
  );
}

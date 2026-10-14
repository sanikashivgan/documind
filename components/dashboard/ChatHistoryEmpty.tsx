export default function ChatHistoryEmpty() {
  return (
    <section
      id="chat-history"
      className="rounded-xl border border-dashed border-slate-300 bg-surface p-6 sm:p-8"
      aria-labelledby="chat-empty-heading"
    >
      <h2
        id="chat-empty-heading"
        className="text-base font-semibold text-foreground"
      >
        Chat History
      </h2>
      <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-slate-50 text-slate-500"
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5V12a1.5 1.5 0 0 1-1.5 1.5H8l-4 3v-3H4.5A1.5 1.5 0 0 1 3 12V4.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            No conversations yet
          </h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
            After you start asking questions about a PDF, your chat threads will
            show up here. Chat and AI answers are not wired up in this UI
            milestone.
          </p>
        </div>
      </div>
    </section>
  );
}

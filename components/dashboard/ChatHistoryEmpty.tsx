export default function ChatHistoryEmpty() {
  return (
    <section
      id="chat-history"
      className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_36px_-32px_rgba(15,23,42,0.35)] sm:p-7"
      aria-labelledby="chat-empty-heading"
    >
      <h2
        id="chat-empty-heading"
        className="text-sm font-semibold tracking-tight text-slate-900"
      >
        Chat History
      </h2>
      <div className="mt-5 flex flex-col items-start gap-4 rounded-xl bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:p-5">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500"
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
          <h3 className="text-sm font-semibold text-slate-900">
            No conversations yet
          </h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
            Ask questions from any document page. Saved conversation history
            isn’t available yet, so answers stay with the document you’re
            reading.
          </p>
        </div>
      </div>
    </section>
  );
}

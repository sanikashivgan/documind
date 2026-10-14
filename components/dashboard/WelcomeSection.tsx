type WelcomeSectionProps = {
  onUploadClick?: () => void;
};

export default function WelcomeSection({ onUploadClick }: WelcomeSectionProps) {
  return (
    <section
      className="rounded-xl border border-border bg-surface p-6 sm:p-8"
      aria-labelledby="welcome-heading"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-medium text-accent">Welcome back</p>
          <h2
            id="welcome-heading"
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Your documents, understood.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Upload a PDF and ask questions in plain language. DocuMind helps you
            find answers, summaries, and key details without digging through
            pages manually.
          </p>
        </div>

        <button
          type="button"
          onClick={onUploadClick}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="Upload PDF (coming soon)"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9 12V3M9 3L5.5 6.5M9 3l3.5 3.5M3 15h12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Upload PDF
        </button>
      </div>
      <p className="mt-4 text-xs text-muted">
        Upload is a UI placeholder for now — backend and AI features are not
        connected yet.
      </p>
    </section>
  );
}

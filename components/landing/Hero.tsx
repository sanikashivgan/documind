import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="overflow-hidden border-b border-border bg-white"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:px-8 lg:py-24">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50/70 px-3 py-1.5 text-xs font-semibold text-teal-800">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            A clearer way to work with documents
          </p>
          <h1
            id="hero-heading"
            className="mt-6 text-[2.65rem] font-semibold leading-[1.08] tracking-[-0.055em] text-foreground sm:text-5xl lg:text-[3.65rem]"
          >
            Your documents,
            <br className="hidden sm:block" /> understood.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Find the details that matter. Ask questions in plain language and
            explore answers grounded in the documents you trust.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-white shadow-sm shadow-teal-900/15 transition-colors hover:bg-teal-800"
            >
              Create your free account
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3.25 8h9.5m0 0L8.5 3.75M12.75 8 8.5 12.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="secondary-button min-h-12 px-5"
            >
              Log in
            </Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">
            Private document storage · PDF, DOCX, and TXT support
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[36rem]" aria-label="Product preview">
          <div className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,_rgba(8,127,120,0.11)_0%,_transparent_70%)]" aria-hidden="true" />
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_25px_80px_-35px_rgba(20,60,61,0.32)]">
            <div className="flex h-12 items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 sm:px-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-800" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M4.5 2.25h4l3 3v8.5H4.5a1 1 0 0 1-1-1v-9.5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                    <path d="M8.5 2.5v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-xs font-semibold text-slate-700">Document workspace</span>
              </div>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-800">
                Private
              </span>
            </div>
            <div className="grid min-h-[21rem] sm:grid-cols-[0.86fr_1.14fr]">
              <div className="hidden border-r border-slate-100 p-5 sm:block">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Your documents
                </p>
                <div className="mt-4 rounded-lg border border-teal-100 bg-teal-50/60 p-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[9px] font-bold text-teal-800 ring-1 ring-teal-100">PDF</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-semibold text-slate-800">Project overview</span>
                      <span className="mt-1 block text-[10px] text-slate-500">Recently added</span>
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2.5 rounded-lg p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-bold text-slate-500">DOC</span>
                  <span className="text-[11px] font-medium text-slate-600">Meeting notes</span>
                </div>
                <div className="mt-3 flex items-center gap-2.5 rounded-lg p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-bold text-slate-500">TXT</span>
                  <span className="text-[11px] font-medium text-slate-600">Research brief</span>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Ask your document
                  </p>
                </div>
                <div className="ml-auto max-w-[90%] rounded-xl rounded-br-sm bg-slate-100 px-3.5 py-3 text-xs leading-5 text-slate-700">
                  What are the key points I should know?
                </div>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent-soft text-accent" aria-hidden="true">
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                        <path d="m8 1.75 1.5 4.75 4.75 1.5-4.75 1.5L8 14.25l-1.5-4.75-4.75-1.5L6.5 6.5 8 1.75Z" stroke="currentColor" strokeWidth="1.15" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <p className="text-xs font-semibold text-slate-800">A grounded answer</p>
                  </div>
                  <div className="mt-3 space-y-2 text-[11px] leading-[1.65] text-slate-600">
                    <p>Explore the most relevant information from your file, with the source passage close at hand.</p>
                  </div>
                  <div className="mt-3 rounded-lg border-l-2 border-accent bg-teal-50/60 px-3 py-2 text-[10px] leading-4 text-slate-600">
                    Supporting excerpt from the document
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5">
                  <span className="flex-1 text-[10px] text-slate-400">Ask a question about this file…</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-white" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8m0 0L6.5 2.5M10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-slate-400">
            A calmer way to find what matters in your files
          </p>
        </div>
      </div>
    </section>
  );
}

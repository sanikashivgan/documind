const steps = [
  {
    step: "01",
    title: "Add a document",
    description: "Upload a PDF, DOCX, or TXT file to your private library.",
  },
  {
    step: "02",
    title: "Ask a question",
    description: "Ask a question or search for a phrase in the document’s extracted text.",
  },
  {
    step: "03",
    title: "Check the source",
    description: "Read the response and review its supporting passages in context.",
  },
] as const;

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-b border-border bg-white py-20 sm:py-24"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-accent">
            Simple by design
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl"
          >
            From file to finding, in three steps.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Three simple steps from upload to verified insight.
          </p>
        </div>

        <ol className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {steps.map((item) => (
            <li key={item.step} className="flex gap-4 rounded-2xl border border-border bg-slate-50/70 p-5 sm:p-6">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal-100 bg-white text-xs font-semibold tracking-wide text-accent"
                aria-hidden="true"
              >
                {item.step}
              </span>
              <div>
                <h3 className="pt-0.5 text-sm font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

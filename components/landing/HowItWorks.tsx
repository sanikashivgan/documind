const steps = [
  {
    step: "1",
    title: "Upload a PDF",
    description: "Add a document to your library so DocuMind can index its content.",
  },
  {
    step: "2",
    title: "Ask a question",
    description: "Type what you need to know in everyday language — no special syntax required.",
  },
  {
    step: "3",
    title: "Review the answer",
    description: "Read the response and check the cited source passages for confidence.",
  },
] as const;

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-b border-border bg-surface py-16 sm:py-20"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2
            id="how-it-works-heading"
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            How It Works
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Three simple steps from upload to verified insight.
          </p>
        </div>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((item) => (
            <li key={item.step} className="flex gap-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-accent-soft text-sm font-semibold text-accent"
                aria-hidden="true"
              >
                {item.step}
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
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

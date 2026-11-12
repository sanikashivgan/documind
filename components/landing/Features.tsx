const features = [
  {
    title: "A private library",
    description:
      "Keep your PDFs, Word documents, and text files together in a personal workspace built around your account.",
    icon: "library",
  },
  {
    title: "Answers from your files",
    description:
      "Ask naturally. Get focused responses based on the extracted text in the document you’re reading.",
    icon: "spark",
  },
  {
    title: "Sources close at hand",
    description:
      "Review the matching passages alongside an answer, or search the document directly to verify a detail.",
    icon: "quote",
  },
] as const;

export default function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-b border-border bg-background py-20 sm:py-24"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-accent">
            Made for focus
          </p>
          <h2
            id="features-heading"
            className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl"
          >
            Less searching. More understanding.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            The essentials for turning dense documents into clear, useful insight.
          </p>
        </div>

        <ul className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="rounded-2xl border border-border bg-white p-6 shadow-[0_8px_28px_-24px_rgba(15,54,55,0.3)] sm:p-7"
            >
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent" aria-hidden="true">
                {feature.icon === "library" ? (
                  <svg width="21" height="21" viewBox="0 0 20 20" fill="none">
                    <path d="M4.75 3h7l3.5 3.5v10a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3.25 16.5v-12A1.5 1.5 0 0 1 4.75 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    <path d="M11.75 3.25v3.5h3.5M6.5 10h5.5M6.5 13h5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : feature.icon === "spark" ? (
                  <svg width="21" height="21" viewBox="0 0 20 20" fill="none">
                    <path d="m10 2 1.9 6.1L18 10l-6.1 1.9L10 18l-1.9-6.1L2 10l6.1-1.9L10 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="21" height="21" viewBox="0 0 20 20" fill="none">
                    <path d="M6.5 4.25h-1A2.25 2.25 0 0 0 3.25 6.5v1A2.25 2.25 0 0 0 5.5 9.75h1.25V6.5A2.25 2.25 0 0 0 4.5 4.25m9 0h1A2.25 2.25 0 0 1 16.75 6.5v1a2.25 2.25 0 0 1-2.25 2.25h-1.25V6.5a2.25 2.25 0 0 1 2.25-2.25M6.5 15.75h-1A2.25 2.25 0 0 1 3.25 13.5v-1A2.25 2.25 0 0 1 5.5 10.25h1.25v3.25A2.25 2.25 0 0 1 4.5 15.75m9 0h1a2.25 2.25 0 0 0 2.25-2.25v-1a2.25 2.25 0 0 0-2.25-2.25h-1.25v3.25a2.25 2.25 0 0 0 2.25 2.25" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2.5 text-sm leading-6 text-muted">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const features = [
  {
    title: "PDF Library",
    description:
      "Keep your documents organized in one place. Browse uploads, reopen files, and pick up where you left off.",
  },
  {
    title: "AI-Powered Answers",
    description:
      "Ask natural-language questions about any PDF and get concise answers grounded in the content you uploaded.",
  },
  {
    title: "Verifiable Sources",
    description:
      "Every answer can point back to the passages it came from, so you can verify details without re-reading the whole file.",
  },
] as const;

export default function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-b border-border bg-background py-16 sm:py-20"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2
            id="features-heading"
            className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
          >
            Features
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Everything you need to turn dense PDFs into answers you can act on.
          </p>
        </div>

        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="rounded-xl border border-border bg-surface p-6"
            >
              <div
                className="mb-4 h-1 w-10 rounded-full bg-accent"
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

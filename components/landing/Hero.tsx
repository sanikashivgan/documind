import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden border-b border-border bg-surface"
      aria-labelledby="hero-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent-soft)_0%,_transparent_55%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <p className="text-sm font-semibold tracking-wide text-accent">DocuMind</p>
        <h1
          id="hero-heading"
          className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
        >
          Your documents, understood.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
          Upload PDFs, ask questions in plain language, and get clear answers
          with source references so you can trust what you read.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Log In
          </Link>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="border-b border-border/80 bg-white">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-semibold tracking-tight text-white shadow-sm shadow-teal-900/15"
              aria-hidden="true"
            >
              DM
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              DocuMind
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_0.85fr] lg:gap-20 lg:px-8">
        <div className="hidden max-w-xl lg:block">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            A workspace made for clarity
          </p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.12] tracking-[-0.05em] text-foreground xl:text-5xl">
            Your important files, all in focus.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-muted">
            A private place to keep your documents, find the details you need,
            and move forward with confidence.
          </p>
          <div className="mt-9 rounded-2xl border border-border bg-white p-5 shadow-[0_12px_34px_-28px_rgba(15,54,55,0.4)]">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent" aria-hidden="true">
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2.25 14.5 4v4.125c0 3.4-2.3 6.15-5.5 7.625-3.2-1.475-5.5-4.225-5.5-7.625V4L9 2.25Z" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
                  <path d="m6.5 8.5 1.75 1.75 3.5-3.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Your workspace stays yours</p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Your documents are associated with your account and stored privately.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Welcome to DocuMind
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-[1.75rem]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
          </div>
          <div className="rounded-2xl border border-border bg-white p-6 shadow-[0_12px_34px_-28px_rgba(15,54,55,0.4)] sm:p-8">
            {children}
          </div>
          <p className="mt-5 text-center text-xs text-muted">
            Secure access to your personal document workspace.
          </p>
        </div>
      </main>
    </div>
  );
}

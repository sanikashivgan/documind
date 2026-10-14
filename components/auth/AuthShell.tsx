import Link from "next/link";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-lg items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white"
              aria-hidden="true"
            >
              DM
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              DocuMind
            </span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

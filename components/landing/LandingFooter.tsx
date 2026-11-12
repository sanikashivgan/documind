import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="bg-background py-10 sm:py-12" aria-label="Site footer">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">DocuMind</p>
          <p className="mt-1 text-sm text-muted">
            A quieter, clearer way to work with your documents.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <li>
              <a href="#features" className="hover:text-foreground">
                Features
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="hover:text-foreground">
                How It Works
              </a>
            </li>
            <li>
              <Link href="/login" className="hover:text-foreground">
                Log In
              </Link>
            </li>
            <li>
              <Link href="/signup" className="hover:text-foreground">
                Get Started
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-border px-4 pt-6 sm:px-6 lg:px-8">
        <p className="text-xs text-muted">
          © 2026 DocuMind. Your documents remain private to your account.
        </p>
      </div>
    </footer>
  );
}

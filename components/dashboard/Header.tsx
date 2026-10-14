type HeaderProps = {
  title: string;
  onMenuClick: () => void;
};

export default function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-slate-600 hover:bg-slate-50 lg:hidden"
          aria-label="Open navigation menu"
        >
          <span className="sr-only">Open menu</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-foreground">Alex Rivera</p>
          <p className="text-xs text-muted">Demo profile</p>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-slate-100 text-sm font-semibold text-slate-700"
          aria-hidden="true"
        >
          AR
        </div>
      </div>
    </header>
  );
}

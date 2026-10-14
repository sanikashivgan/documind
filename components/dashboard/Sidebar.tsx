"use client";

import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/dashboard", current: true },
  { label: "My Documents", href: "#documents", current: false },
  { label: "Chat History", href: "#chat-history", current: false },
  { label: "Settings", href: "#settings", current: false },
] as const;

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white"
            aria-hidden="true"
          >
            DM
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-foreground">
              DocuMind
            </p>
            <p className="text-xs text-muted">Document Intelligence</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Sidebar">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              aria-current={item.current ? "page" : undefined}
              className={[
                "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                item.current
                  ? "bg-accent-soft text-accent"
                  : "text-slate-600 hover:bg-slate-50 hover:text-foreground",
              ].join(" ")}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <p className="text-xs text-muted">
            Frontend preview · Demo data only
          </p>
        </div>
      </aside>
    </>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
] as const;

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
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

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Landing navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 hover:text-foreground"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Get Started
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-slate-600 hover:bg-slate-50 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            {open ? (
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-border px-4 py-4 md:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/login"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                Log In
              </Link>
            </li>
            <li className="pt-2">
              <Link
                href="/signup"
                className="block rounded-lg bg-accent px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-800"
                onClick={() => setOpen(false)}
              >
                Get Started
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

"use client";

import { useRef, useState } from "react";
import type { RefObject } from "react";
import { useRouter } from "next/navigation";
import { attemptLogout } from "@/lib/auth/logout";
import { createClient } from "@/lib/supabase/client";

type HeaderProps = {
  title: string;
  email: string;
  menuOpen: boolean;
  onMenuClick: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
};

export default function Header({
  title,
  email,
  menuOpen,
  onMenuClick,
  menuButtonRef,
}: HeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const logoutInProgress = useRef(false);

  async function handleLogout() {
    if (logoutInProgress.current) return;

    logoutInProgress.current = true;
    setLoggingOut(true);
    setLogoutError(false);
    let logoutSucceeded = false;

    try {
      const result = await attemptLogout(() =>
        createClient().auth.signOut(),
      );
      if (!result.success) {
        setLogoutError(true);
        return;
      }

      logoutSucceeded = true;
      router.replace("/login?loggedOut=1");
      router.refresh();
    } finally {
      if (!logoutSucceeded) {
        logoutInProgress.current = false;
        setLoggingOut(false);
      }
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-9">
      <div className="flex h-[4.25rem] items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-offset-2 lg:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="dashboard-sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              ) : (
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </svg>
          </button>
          <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            {title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <div className="hidden text-right sm:block">
            <p className="max-w-56 truncate text-sm font-medium text-slate-800">
              {email}
            </p>
            <p className="text-xs text-slate-500">Signed in</p>
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full border border-teal-100 bg-teal-50 text-sm font-semibold text-teal-800"
            aria-hidden="true"
          >
            {email.charAt(0).toUpperCase()}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-offset-2 disabled:opacity-60"
          >
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
      </div>
      {logoutError ? (
        <p
          className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          role="alert"
          aria-live="assertive"
        >
          Could not log out. Check your connection and try again.
        </p>
      ) : null}
    </header>
  );
}

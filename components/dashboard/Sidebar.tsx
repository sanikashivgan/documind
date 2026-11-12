"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: "overview" },
  { label: "Documents", href: "/dashboard#documents", icon: "document" },
  { label: "Chat history", href: "/dashboard#chat-history", icon: "chat" },
] as const;

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

export default function Sidebar({
  open,
  onClose,
  returnFocusRef,
}: SidebarProps) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const updateViewport = () => setIsMobile(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);
    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, [pathname]);

  useEffect(() => {
    if (open && !isMobile) onClose();
  }, [isMobile, onClose, open]);

  useEffect(() => {
    if (!open || !isMobile) return;

    previousFocusRef.current =
      returnFocusRef.current ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !sidebarRef.current) return;

      const focusable = Array.from(
        sidebarRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        ),
      ).filter((element) => element.offsetWidth > 0 || element.offsetHeight > 0);

      if (focusable.length === 0) {
        event.preventDefault();
        sidebarRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus();
      }
    };
  }, [isMobile, onClose, open, returnFocusRef]);

  function isCurrent(item: (typeof navItems)[number]) {
    if (item.label === "Overview") {
      return pathname === "/dashboard" && hash !== "#documents" && hash !== "#chat-history";
    }
    if (item.label === "Documents") {
      return pathname.startsWith("/documents/") ||
        (pathname === "/dashboard" && hash === "#documents");
    }
    return pathname === "/dashboard" && hash === "#chat-history";
  }

  return (
    <>
      {open && isMobile ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        ref={sidebarRef}
        id="dashboard-sidebar"
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-2.5rem))] flex-col border-r border-slate-200 bg-white shadow-[0_24px_70px_-35px_rgba(15,23,42,0.5)] transition-[transform,visibility] duration-200 motion-reduce:transition-none lg:sticky lg:top-0 lg:h-screen lg:w-[17rem] lg:shrink-0 lg:translate-x-0 lg:shadow-none",
          open ? "visible translate-x-0" : "invisible -translate-x-full lg:visible",
        ].join(" ")}
        aria-label="Dashboard navigation"
        aria-hidden={isMobile && !open}
        aria-modal={isMobile && open ? true : undefined}
        role={isMobile && open ? "dialog" : undefined}
        inert={isMobile && !open}
        tabIndex={-1}
      >
        <div className="flex h-[4.25rem] shrink-0 items-center gap-3 border-b border-slate-200/80 px-5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-sm font-bold tracking-tight text-white shadow-sm shadow-teal-900/15"
            aria-hidden="true"
          >
            DM
          </div>
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-slate-900">
              DocuMind
            </p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-[0.14em] text-slate-400">
              PRIVATE WORKSPACE
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-offset-2 lg:hidden"
            aria-label="Close navigation menu"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <p className="px-5 pb-2 pt-7 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </p>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Workspace">
          {navItems.map((item) => {
            const current = isCurrent(item);
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                aria-current={current ? "page" : undefined}
                className={[
                  "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition-colors focus-visible:outline-offset-2",
                  current
                    ? "bg-teal-50 text-teal-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")}
              >
                <svg
                  className="h-[18px] w-[18px] shrink-0"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  {item.icon === "overview" ? (
                    <path
                      d="M3.5 10.5 10 4l6.5 6.5M5.5 9v6.5h9V9M8 15.5v-4h4v4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : item.icon === "document" ? (
                    <>
                      <path
                        d="M6 2.75h5l4.25 4.5v9.5A1.25 1.25 0 0 1 14 18H6a1.25 1.25 0 0 1-1.25-1.25V4A1.25 1.25 0 0 1 6 2.75Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                      <path d="M7.5 10h5M7.5 13h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </>
                  ) : (
                    <path
                      d="M3 4.75A1.75 1.75 0 0 1 4.75 3h10.5A1.75 1.75 0 0 1 17 4.75v7.5A1.75 1.75 0 0 1 15.25 14H8l-4 3v-3.4A1.75 1.75 0 0 1 3 11.75v-7Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/80 p-4">
          <div className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 ring-1 ring-slate-200">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 1.75 13 3.5v3.75c0 3.1-2.1 5.6-5 7-2.9-1.4-5-3.9-5-7V3.5l5-1.75Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="m5.75 7.75 1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="text-xs leading-5 text-slate-600">
              Your files are stored privately and tied to your account.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

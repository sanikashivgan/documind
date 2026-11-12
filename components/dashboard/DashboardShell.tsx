"use client";

import { useCallback, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

type DashboardShellProps = {
  children: React.ReactNode;
  email: string;
  title?: string;
};

export default function DashboardShell({
  children,
  email,
  title = "Dashboard",
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="min-h-screen bg-slate-50/80 lg:flex">
      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        returnFocusRef={menuButtonRef}
      />
      <div
        className="flex min-h-screen min-w-0 flex-1 flex-col"
        inert={sidebarOpen}
      >
        <Header
          title={title}
          email={email}
          menuOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen((open) => !open)}
          menuButtonRef={menuButtonRef}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}

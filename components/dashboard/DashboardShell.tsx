"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

type DashboardShellProps = {
  children: React.ReactNode;
  title?: string;
};

export default function DashboardShell({
  children,
  title = "Dashboard",
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-full bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

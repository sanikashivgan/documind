import { Suspense } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import SummaryCards from "@/components/dashboard/SummaryCards";
import RecentDocuments from "@/components/dashboard/RecentDocuments";
import ChatHistoryEmpty from "@/components/dashboard/ChatHistoryEmpty";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_DOCUMENT_PAGE_SIZE } from "@/lib/documents/document-list";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AuthenticatedDashboard />
    </Suspense>
  );
}

function DashboardLoading() {
  return (
    <main
      className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8"
      aria-label="Loading dashboard"
      aria-busy="true"
    >
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="h-40 rounded-xl border border-border bg-surface" />
        <div className="h-28 rounded-xl border border-border bg-surface" />
        <div className="h-72 rounded-xl border border-border bg-surface" />
      </div>
    </main>
  );
}

async function AuthenticatedDashboard() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const {
    data: documents,
    count: documentCount,
    error: documentsError,
  } = await supabase
    .from("documents")
    .select("id, name, file_type, file_size, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(0, DEFAULT_DOCUMENT_PAGE_SIZE - 1);

  if (documentsError) {
    console.error("Dashboard document query failed:", documentsError.message);
  }

  return (
    <DashboardShell title="Dashboard" email={user.email}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <WelcomeSection />
        <SummaryCards
          documentCount={documentsError ? null : (documentCount ?? 0)}
        />
        <RecentDocuments
          documents={documents ?? []}
          totalCount={documentCount ?? 0}
          hasMore={(documents?.length ?? 0) < (documentCount ?? 0)}
          error={Boolean(documentsError)}
        />
        <ChatHistoryEmpty />
      </div>
    </DashboardShell>
  );
}

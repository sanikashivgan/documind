import DashboardShell from "@/components/dashboard/DashboardShell";
import WelcomeSection from "@/components/dashboard/WelcomeSection";
import SummaryCards from "@/components/dashboard/SummaryCards";
import RecentDocuments from "@/components/dashboard/RecentDocuments";
import ChatHistoryEmpty from "@/components/dashboard/ChatHistoryEmpty";

export default function DashboardPage() {
  return (
    <DashboardShell title="Dashboard">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <WelcomeSection />
        <SummaryCards />
        <RecentDocuments />
        <ChatHistoryEmpty />
      </div>
    </DashboardShell>
  );
}

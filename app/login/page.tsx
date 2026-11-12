import type { Metadata } from "next";
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log In — DocuMind",
  description: "Log in to DocuMind to access your PDF document library.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthShell
      title="Log in"
      subtitle="Access your document library."
    >
      <Suspense fallback={<LoginForm />}>
        <LoginFormWithCallbackStatus searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function LoginFormWithCallbackStatus({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { error, loggedOut } = await searchParams;
  return (
    <LoginForm
      callbackError={error === "confirmation"}
      loggedOut={loggedOut === "1"}
    />
  );
}

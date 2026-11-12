import type { Metadata } from "next";
import { Suspense } from "react";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password — DocuMind",
  description: "Choose a new password for your DocuMind account.",
};

export default function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a new password for your DocuMind account."
    >
      <Suspense
        fallback={
          <p className="text-sm text-muted" role="status">
            Checking your reset link...
          </p>
        }
      >
        <ResetPasswordFormWithRecoveryStatus searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function ResetPasswordFormWithRecoveryStatus({
  searchParams,
}: {
  searchParams: PageProps<"/reset-password">["searchParams"];
}) {
  const { error } = await searchParams;
  return <ResetPasswordForm recoveryError={error === "recovery"} />;
}

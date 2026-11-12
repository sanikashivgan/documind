import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password — DocuMind",
  description: "Request a secure link to reset your DocuMind password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the email address associated with your account and we’ll send you a reset link."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log In — DocuMind",
  description: "Log in to DocuMind to access your PDF document library.",
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Log in"
      subtitle="Access your document library. Authentication will be connected in a later milestone."
    >
      <LoginForm />
    </AuthShell>
  );
}

import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign Up — DocuMind",
  description: "Create a DocuMind account to start asking questions about your PDFs.",
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up to upload PDFs and ask questions. Authentication will be connected in a later milestone."
    >
      <SignupForm />
    </AuthShell>
  );
}

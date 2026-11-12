"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setHasError(false);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Enter a valid email address.");
      setHasError(true);
      setPending(false);
      return;
    }

    if (!password || !confirmPassword) {
      setMessage("Enter and confirm your password.");
      setHasError(true);
      setPending(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setHasError(true);
      setPending(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: name ? { full_name: name } : {},
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        setMessage(error.message);
        setHasError(true);
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setMessage("Check your email for a confirmation link to finish signing up.");
    } catch {
      setMessage("We couldn’t reach the sign-up service. Check your connection and try again.");
      setHasError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <label
          htmlFor="signup-name"
          className="block text-sm font-medium text-foreground"
        >
          Name{" "}
          <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          className="form-field mt-1.5"
          placeholder="Alex Rivera"
        />
      </div>

      <div>
        <label
          htmlFor="signup-email"
          className="block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="form-field mt-1.5"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="signup-password"
          className="block text-sm font-medium text-foreground"
        >
          Password
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="form-field mt-1.5"
          placeholder="Create a password"
        />
      </div>

      <div>
        <label
          htmlFor="signup-confirm-password"
          className="block text-sm font-medium text-foreground"
        >
          Confirm password
        </label>
        <input
          id="signup-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="form-field mt-1.5"
          placeholder="Confirm your password"
        />
      </div>

      {message ? (
        <p
          id="signup-message"
          className={`rounded-lg border px-3 py-2.5 text-sm leading-relaxed ${
            hasError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
          role={hasError ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="primary-button w-full"
      >
        {pending ? "Creating account..." : "Sign Up"}
      </button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-accent hover:text-teal-800"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}

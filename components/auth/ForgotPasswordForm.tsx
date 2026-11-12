"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setHasError(false);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Enter a valid email address.");
      setHasError(true);
      setPending(false);
      return;
    }

    try {
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", "/reset-password");

      const { error } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo.toString(),
      });

      if (error) {
        setMessage(error.message);
        setHasError(true);
      } else {
        setMessage(
          "If an account exists for that email, we’ve sent a password reset link. Check your inbox.",
        );
      }
    } catch {
      setMessage("We couldn’t send the reset email. Please try again.");
      setHasError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <label
          htmlFor="forgot-password-email"
          className="block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="forgot-password-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby="forgot-password-help"
          className="form-field mt-1.5"
          placeholder="you@example.com"
        />
        <p id="forgot-password-help" className="mt-2 text-xs leading-relaxed text-muted">
          We’ll email you a secure link to choose a new password.
        </p>
      </div>

      {message ? (
        <p
          className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
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
        {pending ? "Sending reset link..." : "Send reset link"}
      </button>

      <p className="text-center text-sm text-muted">
        Remember your password?{" "}
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

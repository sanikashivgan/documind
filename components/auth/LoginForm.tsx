"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  callbackError?: boolean;
  loggedOut?: boolean;
};

export default function LoginForm({
  callbackError = false,
  loggedOut = false,
}: LoginFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(
    callbackError
      ? "Email confirmation failed. Please try again."
      : loggedOut
        ? "You’ve been logged out successfully."
        : "",
  );
  const [hasError, setHasError] = useState(callbackError);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setHasError(false);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      setMessage("Enter a valid email address and your password.");
      setHasError(true);
      setPending(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
        setHasError(true);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setMessage("We couldn’t reach the sign-in service. Check your connection and try again.");
      setHasError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <label
          htmlFor="login-email"
          className="block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="login-email"
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
          htmlFor="login-password"
          className="block text-sm font-medium text-foreground"
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="form-field mt-1.5"
          placeholder="Enter your password"
        />
        <div className="mt-2 text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-accent hover:text-teal-800"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {message ? (
        <p
          id="login-message"
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
        {pending ? "Logging in..." : "Log In"}
      </button>

      <p className="text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-accent hover:text-teal-800"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}

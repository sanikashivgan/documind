"use client";

import Link from "next/link";
import { FormEvent } from "react";

export default function LoginForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: Integrate Supabase authentication. Submit is disabled until then.
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
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
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
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="Enter your password"
        />
      </div>

      <p
        className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-muted"
        role="note"
      >
        TODO: Authentication is not connected yet. Log In stays disabled until
        Supabase auth is integrated.
      </p>

      <button
        type="submit"
        disabled
        aria-disabled="true"
        title="Authentication not integrated yet"
        className="w-full cursor-not-allowed rounded-lg bg-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-500"
      >
        Log In
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

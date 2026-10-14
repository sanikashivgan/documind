"use client";

import Link from "next/link";
import { FormEvent } from "react";

export default function SignupForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: Integrate Supabase authentication. Submit is disabled until then.
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
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
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
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
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
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
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
          className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="Confirm your password"
        />
      </div>

      <p
        className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-muted"
        role="note"
      >
        TODO: Authentication is not connected yet. Sign Up stays disabled until
        Supabase auth is integrated.
      </p>

      <button
        type="submit"
        disabled
        aria-disabled="true"
        title="Authentication not integrated yet"
        className="w-full cursor-not-allowed rounded-lg bg-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-500"
      >
        Sign Up
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

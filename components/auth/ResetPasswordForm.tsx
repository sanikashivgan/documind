"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type ResetPasswordFormProps = {
  recoveryError?: boolean;
};

export default function ResetPasswordForm({
  recoveryError = false,
}: ResetPasswordFormProps) {
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [needsRecovery, setNeedsRecovery] = useState(recoveryError);
  const [message, setMessage] = useState(
    recoveryError
      ? "This password reset link is invalid or has expired. Request a new link to continue."
      : "",
  );
  const [hasError, setHasError] = useState(recoveryError);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setHasError(false);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!password || !confirmPassword) {
      setMessage("Enter and confirm your new password.");
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
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setMessage(
          "This password reset link is invalid or has expired. Request a new link to continue.",
        );
        setHasError(true);
        setNeedsRecovery(true);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage(error.message);
        setHasError(true);
        return;
      }

      setCompleted(true);
    } catch {
      setMessage(
        "We couldn’t update your password. The reset link may have expired; request a new one and try again.",
      );
      setHasError(true);
    } finally {
      setPending(false);
    }
  }

  if (completed) {
    return (
      <div className="space-y-5">
        <p
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-relaxed text-emerald-700"
          role="status"
        >
          Your password has been updated. You can now continue to your
          documents.
        </p>
        <Link
          href="/dashboard"
          className="primary-button w-full"
        >
          Continue to DocuMind
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <label
          htmlFor="reset-password"
          className="block text-sm font-medium text-foreground"
        >
          New password
        </label>
        <input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="form-field mt-1.5"
          placeholder="Enter your new password"
        />
      </div>

      <div>
        <label
          htmlFor="reset-confirm-password"
          className="block text-sm font-medium text-foreground"
        >
          Confirm new password
        </label>
        <input
          id="reset-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="form-field mt-1.5"
          placeholder="Confirm your new password"
        />
      </div>

      {message ? (
        <div
          className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
            hasError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
          role={hasError ? "alert" : "status"}
        >
          <p>{message}</p>
          {needsRecovery ? (
            <Link
              href="/forgot-password"
              className="mt-1 inline-block font-medium underline"
            >
              Request another reset link
            </Link>
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending || needsRecovery}
        className="primary-button w-full"
      >
        {pending ? "Updating password..." : "Update password"}
      </button>

      {!needsRecovery ? (
        <p className="text-center text-sm text-muted">
          Need a new reset link?{" "}
          <Link
            href="/forgot-password"
            className="font-medium text-accent hover:text-teal-800"
          >
            Request one
          </Link>
        </p>
      ) : null}
    </form>
  );
}

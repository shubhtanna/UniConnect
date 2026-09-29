"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "otp";
type Status = "idle" | "sending" | "verifying" | "navigating";

async function postJson(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as {
    error?: string;
    redirectTo?: string;
    devOtp?: string;
  };
  if (!response.ok) throw new Error(data.error ?? "Something went wrong");
  return data;
}

export function LoginForm() {
  const router = useRouter();
  const otpInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@mastersunion\.org$/.test(normalizedEmail)) {
      setError("Use your official @mastersunion.org email address.");
      return;
    }
    setEmail(normalizedEmail);
    setStatus("sending");
    setStep("otp");
    window.setTimeout(() => otpInput.current?.focus(), 0);

    try {
      const result = await postJson("/api/auth/request-otp", { email });
      setDevOtp(result.devOtp ?? "");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not send the code",
      );
      setStep("email");
    } finally {
      setStatus("idle");
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("verifying");

    try {
      const result = await postJson("/api/auth/verify-otp", { email, otp });
      setStatus("navigating");
      router.replace(result.redirectTo ?? "/dashboard");
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : "Could not verify the code",
      );
      setStatus("idle");
    }
  }

  return (
    <div>
      <p className="eyebrow">Welcome to UniConnect</p>
      <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-ink">
        {step === "email" ? "Sign in to continue" : "Check your inbox"}
      </h2>
      <p className="mt-3 leading-7 text-ink/60">
        {step === "email"
          ? "Enter your official MU email and we'll send you a secure sign-in code."
          : status === "sending"
            ? `Preparing a secure code for ${email}…`
            : `We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
      </p>

      {step === "email" ? (
        <form className="mt-9" onSubmit={requestOtp} noValidate>
          <label className="field-label" htmlFor="email">
            MU email address
          </label>
          <input
            className="text-field"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@mastersunion.org"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby={error ? "login-error" : "email-help"}
            required
          />
          <p id="email-help" className="mt-2 text-xs text-ink/45">
            Personal and non-MU email addresses are not accepted.
          </p>
          {error && <ErrorMessage message={error} />}
          <button
            className="primary-button mt-6 w-full"
            type="submit"
            disabled={status !== "idle"}
          >
            {status === "sending" ? "Sending code…" : "Send verification code"}
          </button>
        </form>
      ) : (
        <form className="mt-9" onSubmit={verifyOtp} noValidate>
          <label className="field-label" htmlFor="otp">
            Verification code
          </label>
          <input
            ref={otpInput}
            className="text-field text-center !text-2xl !tracking-[0.3em]"
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={(event) =>
              setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            aria-describedby={error ? "login-error" : undefined}
            disabled={status === "sending" || status === "navigating"}
            required
          />
          {status === "sending" && (
            <p className="mt-3 text-center text-sm text-ink/55" role="status">
              Preparing your secure code…
            </p>
          )}
          {devOtp && (
            <p className="mt-3 rounded-xl border border-teal/20 bg-teal/10 px-4 py-3 text-sm text-teal">
              Local development code:{" "}
              <strong className="tracking-[0.18em]">{devOtp}</strong>
            </p>
          )}
          {error && <ErrorMessage message={error} />}
          <button
            className="primary-button mt-6 w-full"
            type="submit"
            disabled={status !== "idle" || otp.length !== 6}
          >
            {status === "verifying"
              ? "Verifying…"
              : status === "navigating"
                ? "Opening UniConnect…"
                : status === "sending"
                  ? "Sending code…"
                  : "Verify and continue"}
          </button>
          <button
            className="mt-4 w-full py-2 text-sm font-semibold text-teal hover:underline"
            type="button"
            onClick={() => {
              setStep("email");
              setOtp("");
              setError("");
              setDevOtp("");
              setStatus("idle");
            }}
            disabled={status !== "idle"}
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      id="login-error"
      role="alert"
      className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {message}
    </p>
  );
}

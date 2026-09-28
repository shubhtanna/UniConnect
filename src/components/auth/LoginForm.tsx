"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "email" | "otp";

async function postJson(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { error?: string; redirectTo?: string; devOtp?: string };
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
  const [loading, setLoading] = useState(false);

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await postJson("/api/auth/request-otp", { email });
      setDevOtp(result.devOtp ?? "");
      setStep("otp");
      window.setTimeout(() => otpInput.current?.focus(), 0);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not send the code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await postJson("/api/auth/verify-otp", { email, otp });
      router.push(result.redirectTo ?? "/dashboard");
      router.refresh();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Could not verify the code");
    } finally {
      setLoading(false);
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
          : `We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
      </p>

      {step === "email" ? (
        <form className="mt-9" onSubmit={requestOtp} noValidate>
          <label className="field-label" htmlFor="email">MU email address</label>
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
          {devOtp && (
            <p className="mt-3 rounded-xl border border-teal/20 bg-teal/10 px-4 py-3 text-sm text-teal">
              Local development code: <strong className="tracking-[0.18em]">{devOtp}</strong>
            </p>
          )}
          <p id="email-help" className="mt-2 text-xs text-ink/45">Personal and non-MU email addresses are not accepted.</p>
          {error && <ErrorMessage message={error} />}
          <button className="primary-button mt-6 w-full" type="submit" disabled={loading}>
            {loading ? "Sending code…" : "Send verification code"}
          </button>
        </form>
      ) : (
        <form className="mt-9" onSubmit={verifyOtp} noValidate>
          <label className="field-label" htmlFor="otp">Verification code</label>
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
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            aria-describedby={error ? "login-error" : undefined}
            required
          />
          {error && <ErrorMessage message={error} />}
          <button className="primary-button mt-6 w-full" type="submit" disabled={loading || otp.length !== 6}>
            {loading ? "Verifying…" : "Verify and continue"}
          </button>
          <button
            className="mt-4 w-full py-2 text-sm font-semibold text-teal hover:underline"
            type="button"
            onClick={() => {
              setStep("email");
              setOtp("");
              setError("");
              setDevOtp("");
            }}
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
    <p id="login-error" role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </p>
  );
}

import nodemailer from "nodemailer";
import { getServerEnv } from "@/lib/env";

export async function sendOtpEmail(email: string, otp: string) {
  const env = getServerEnv();

  if (!env.SMTP_HOST) {
    if (env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured");
    }

    console.info(`[UniConnect development OTP] ${email}: ${otp}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth:
      env.SMTP_USER && env.SMTP_PASSWORD
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: "Your UniConnect verification code",
    text: `Your UniConnect verification code is ${otp}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#14251f">
        <p style="font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#174c3c">UniConnect</p>
        <h1 style="font-size:26px;margin:12px 0">Verify your MU email</h1>
        <p>Use this code to finish signing in:</p>
        <p style="font-size:34px;font-weight:700;letter-spacing:.18em;margin:24px 0">${otp}</p>
        <p style="color:#5f6d67">The code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>
      </div>
    `,
  });
}

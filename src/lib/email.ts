import nodemailer from "nodemailer";
import { getServerEnv } from "@/lib/env";

type MailTransport = ReturnType<typeof nodemailer.createTransport>;
const globalWithMail = globalThis as typeof globalThis & {
  uniconnectMailTransport?: MailTransport;
};

function getMailTransport() {
  const env = getServerEnv();
  const transporter =
    globalWithMail.uniconnectMailTransport ??
    nodemailer.createTransport({
      pool: true,
      maxConnections: 2,
      maxMessages: 50,
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASSWORD
          ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
          : undefined,
    });
  globalWithMail.uniconnectMailTransport = transporter;
  return transporter;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

export async function sendOtpEmail(email: string, otp: string) {
  const env = getServerEnv();

  if (!env.SMTP_HOST) {
    if (env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured");
    }

    console.info(`[UniConnect development OTP] ${email}: ${otp}`);
    return;
  }

  await getMailTransport().sendMail({
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

export async function sendGroupInvitationEmail({
  email,
  inviterEmail,
  groupName,
  invitationUrl,
}: {
  email: string;
  inviterEmail: string;
  groupName: string;
  invitationUrl: string;
}) {
  const env = getServerEnv();

  if (!env.SMTP_HOST) {
    if (env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured");
    }
    console.info(
      `[UniConnect development group invitation] ${email}: ${invitationUrl}`,
    );
    return;
  }

  const safeGroupName = escapeHtml(groupName);
  const safeInviterEmail = escapeHtml(inviterEmail);
  const safeInvitationUrl = escapeHtml(invitationUrl);

  await getMailTransport().sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: `You are invited to ${groupName} on UniConnect`,
    text: `${inviterEmail} invited you to join "${groupName}" on UniConnect. Sign in with this MU email to accept or decline: ${invitationUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:32px;color:#14251f">
        <p style="font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#174c3c">UniConnect</p>
        <h1 style="font-size:26px;margin:12px 0">You are invited to a brainstorm group</h1>
        <p><strong>${safeInviterEmail}</strong> invited you to join <strong>${safeGroupName}</strong>.</p>
        <p style="margin:28px 0">
          <a href="${safeInvitationUrl}" style="display:inline-block;border-radius:999px;background:#174c3c;color:#fff;padding:12px 20px;text-decoration:none;font-weight:700">Review invitation</a>
        </p>
        <p style="color:#5f6d67">Sign in using this Masters' Union email address. Only the invited account can accept the invitation.</p>
      </div>
    `,
  });
}

export async function sendPlatformInvitationEmail({
  email,
  name,
  platformUrl,
}: {
  email: string;
  name?: string;
  platformUrl: string;
}) {
  const env = getServerEnv();
  if (!env.SMTP_HOST) {
    if (env.NODE_ENV === "production") throw new Error("SMTP is not configured");
    console.info(`[UniConnect development platform invitation] ${email}`);
    return;
  }

  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi,";
  const safeGreeting = escapeHtml(greeting);
  const safePlatformUrl = escapeHtml(platformUrl);
  const subject = "Your UniConnect profile is ready — find the right people at MU";
  const text = `${greeting}

We are inviting you to try UniConnect, a private networking platform built for the Masters' Union community.

Use UniConnect to discover classmates by skills, interests, projects, and goals; find collaborators with AI people search; join focused brainstorm groups; and share what you are building.

To make onboarding easier, we prepared an initial profile using information from the cohort's Master CV collection. You can review, edit, add, or remove any information after signing in.

Open UniConnect: ${platformUrl}

Sign in with this Masters' Union email address. You will receive a one-time verification code; no password is required.

UniConnect is an early-stage student project. Please share your honest feedback after exploring it.

Shubh Tanna
UniConnect`;

  await getMailTransport().sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject,
    text,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:32px;color:#14251f;line-height:1.6">
        <p style="font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#174c3c;font-weight:700">UniConnect</p>
        <p>${safeGreeting}</p>
        <h1 style="font-size:28px;line-height:1.25;margin:14px 0">Your UniConnect profile is ready</h1>
        <p>We are inviting you to try <strong>UniConnect</strong>, a private networking platform built for the Masters' Union community.</p>
        <p>Use UniConnect to discover classmates by skills, interests, projects, and goals; find collaborators with AI people search; join focused brainstorm groups; and share what you are building.</p>
        <p>To make onboarding easier, we prepared an initial profile using information from the cohort's Master CV collection. You can review, edit, add, or remove any information after signing in.</p>
        <p style="margin:28px 0">
          <a href="${safePlatformUrl}" style="display:inline-block;border-radius:999px;background:#174c3c;color:#fff;padding:13px 22px;text-decoration:none;font-weight:700">Open UniConnect</a>
        </p>
        <p>Sign in with this Masters' Union email address. You will receive a one-time verification code; no password is required.</p>
        <p>UniConnect is an early-stage student project. Please share your honest feedback after exploring it.</p>
        <p style="margin-top:28px">Shubh Tanna<br><strong>UniConnect</strong></p>
      </div>
    `,
  });
}

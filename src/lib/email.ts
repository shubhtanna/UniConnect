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

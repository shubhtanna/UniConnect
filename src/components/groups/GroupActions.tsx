"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function InvitationActions({
  invitationId,
  groupId,
}: {
  invitationId: string;
  groupId: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<"accept" | "decline" | "">("");
  const [error, setError] = useState("");

  async function respond(action: "accept" | "decline") {
    setSubmitting(action);
    setError("");
    try {
      const response = await fetch(`/api/groups/invitations/${invitationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not update this invitation");
        return;
      }
      if (action === "accept") router.push(`/groups/${groupId}`);
      else router.refresh();
    } catch {
      setError("Could not reach UniConnect. Please try again.");
    } finally {
      setSubmitting("");
    }
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="primary-button !min-h-10 !px-5 !py-2"
          disabled={Boolean(submitting)}
          onClick={() => void respond("accept")}
        >
          {submitting === "accept" ? "Accepting…" : "Accept invitation"}
        </button>
        <button
          type="button"
          className="secondary-button !min-h-10 !px-5 !py-2"
          disabled={Boolean(submitting)}
          onClick={() => void respond("decline")}
        >
          {submitting === "decline" ? "Declining…" : "Decline"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </div>
  );
}

export function InviteMembers({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setResult("");
    const form = event.currentTarget;
    const values = new FormData(form);
    const inviteEmails = String(values.get("inviteEmails"))
      .split(/[\s,;]+/)
      .map((email) => email.trim())
      .filter(Boolean);

    try {
      const response = await fetch(`/api/groups/${groupId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteEmails }),
      });
      const data = (await response.json()) as {
        error?: string;
        invitationSummary?: {
          created: number;
          sent: number;
          failed: number;
          skipped: number;
        };
      };
      if (!response.ok || !data.invitationSummary) {
        setError(data.error ?? "Could not send these invitations");
        return;
      }

      const summary = data.invitationSummary;
      const parts = [
        summary.sent > 0
          ? `${summary.sent} invitation email${summary.sent === 1 ? "" : "s"} sent`
          : "",
        summary.failed > 0
          ? `${summary.failed} saved for in-app delivery after email failed`
          : "",
        summary.skipped > 0
          ? `${summary.skipped} already invited or already a member`
          : "",
      ].filter(Boolean);
      setResult(parts.join(" · ") || "No new invitations were needed.");
      form.reset();
      router.refresh();
    } catch {
      setError("Could not reach UniConnect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel mt-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Grow this group</p>
          <h2 className="mt-2 text-xl font-semibold">Invite more members</h2>
          <p className="mt-2 text-sm text-muted">
            Add up to 20 official MU addresses at a time.
          </p>
        </div>
        {!open && (
          <button
            type="button"
            className="secondary-button !min-h-10 !px-5 !py-2"
            onClick={() => setOpen(true)}
          >
            Add members
          </button>
        )}
      </div>
      {open && (
        <form onSubmit={submit} className="mt-5">
          <label className="grid gap-2">
            <span className="text-sm text-white">MU email addresses</span>
            <textarea
              name="inviteEmails"
              className="text-field min-h-24"
              placeholder="name@mastersunion.org, another@mastersunion.org"
              required
            />
            <span className="text-xs text-muted">
              Separate addresses with commas, spaces, semicolons, or new lines.
            </span>
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="primary-button" disabled={submitting}>
              {submitting ? "Sending invitations…" : "Send invitations"}
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={submitting}
              onClick={() => {
                setOpen(false);
                setError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {result && (
        <p className="mt-4 rounded-xl border border-teal/30 bg-teal/5 p-3 text-sm text-teal">
          {result}
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </p>
      )}
    </section>
  );
}

export function RevokeInvitationButton({
  groupId,
  invitationId,
}: {
  groupId: string;
  invitationId: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function revoke() {
    if (
      !window.confirm(
        "Take back this invitation? The email cannot be recalled, but its invitation link will stop working.",
      )
    ) {
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(
        `/api/groups/${groupId}/invitations/${invitationId}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not take back this invitation");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not reach UniConnect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        className="text-xs text-red-300 hover:text-red-200 disabled:opacity-60"
        disabled={submitting}
        onClick={() => void revoke()}
      >
        {submitting ? "Taking back…" : "Take back invitation"}
      </button>
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}

export function JoinGroup({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="primary-button"
      onClick={async () => {
        await fetch(`/api/groups/${id}/join`, { method: "POST" });
        router.refresh();
      }}
    >
      Join group
    </button>
  );
}

export function MessageComposer({ id }: { id: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  async function send(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setError("");
    const response = await fetch(`/api/groups/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (response.ok) {
      setBody("");
      router.refresh();
    } else
      setError(
        ((await response.json()) as { error?: string }).error ??
          "Could not send message",
      );
  }
  return (
    <form onSubmit={send} className="mt-6">
      <div className="flex gap-3">
        <input
          className="text-field"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={2000}
          placeholder="Add an idea, question, or useful resource…"
        />
        <button className="primary-button">Send</button>
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </form>
  );
}

export function GroupOwnerActions({
  id,
  name,
  description,
  tags,
  access,
}: {
  id: string;
  name: string;
  description: string;
  tags: string[];
  access: "open" | "invite_only";
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  async function edit() {
    const nextName = window.prompt("Group name", name);
    if (!nextName) return;
    const nextDescription = window.prompt("Group description", description);
    if (!nextDescription) return;
    setEditing(true);
    const response = await fetch(`/api/groups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nextName,
        description: nextDescription,
        tags,
        access,
      }),
    });
    setEditing(false);
    if (response.ok) router.refresh();
    else
      setError(
        ((await response.json()) as { error?: string }).error ??
          "Could not edit group",
      );
  }
  async function remove() {
    if (!window.confirm("Delete this group and hide its discussion?")) return;
    const response = await fetch(`/api/groups/${id}`, { method: "DELETE" });
    if (response.ok) router.push("/groups");
    else
      setError(
        ((await response.json()) as { error?: string }).error ??
          "Could not delete group",
      );
  }
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="secondary-button !min-h-9 !px-4 !py-1.5"
        disabled={editing}
        onClick={edit}
      >
        Edit group
      </button>
      <button
        type="button"
        className="rounded-full border border-red-400/30 px-4 py-2 text-sm text-red-300"
        onClick={remove}
      >
        Delete group
      </button>
      {error && <span className="text-sm text-red-300">{error}</span>}
    </div>
  );
}

export function GroupMessageActions({
  groupId,
  messageId,
  body,
  canEdit,
  canDelete,
}: {
  groupId: string;
  messageId: string;
  body: string;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  async function edit() {
    const nextBody = window.prompt("Edit your message", body);
    if (!nextBody || nextBody === body) return;
    const response = await fetch(
      `/api/groups/${groupId}/messages/${messageId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: nextBody }),
      },
    );
    if (response.ok) router.refresh();
  }
  async function remove() {
    if (!window.confirm("Delete this message?")) return;
    const response = await fetch(
      `/api/groups/${groupId}/messages/${messageId}`,
      { method: "DELETE" },
    );
    if (response.ok) router.refresh();
  }
  if (!canEdit && !canDelete) return null;
  return (
    <div className="flex gap-3">
      {canEdit && (
        <button
          type="button"
          onClick={edit}
          className="text-[11px] text-muted hover:text-teal"
        >
          Edit
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={remove}
          className="text-[11px] text-muted hover:text-red-300"
        >
          Delete
        </button>
      )}
    </div>
  );
}

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

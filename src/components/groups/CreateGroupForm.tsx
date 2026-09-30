"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CreateGroupForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const body = {
      name: form.get("name"),
      description: form.get("description"),
      tags: String(form.get("tags")).split(","),
      access: form.get("access"),
      inviteEmails: String(form.get("invites")).split(",").map((value) => value.trim()).filter(Boolean),
    };

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json() as {
        error?: string;
        groupId?: string;
        invitationSummary?: { created: number; sent: number; failed: number };
      };
      if (!response.ok || !data.groupId) {
        setError(data.error ?? "We could not create this group. Please try again.");
        return;
      }
      const summary = data.invitationSummary;
      const query = summary?.created
        ? `?invited=${summary.created}&sent=${summary.sent}&failed=${summary.failed}`
        : "";
      router.push(`/groups/${data.groupId}${query}`);
    } catch {
      setError("We could not reach UniConnect. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6">
      {!open ? (
        <button className="primary-button" onClick={() => setOpen(true)}>Create brainstorm group</button>
      ) : (
        <form onSubmit={submit} className="panel grid gap-4 p-6 sm:grid-cols-2">
          <label className="grid gap-2"><span className="text-sm text-white">Group name</span><input name="name" className="text-field" placeholder="Climate-tech sprint" minLength={3} maxLength={80} required /></label>
          <label className="grid gap-2"><span className="text-sm text-white">Who can join</span><select name="access" className="text-field"><option value="open">Open to verified students</option><option value="invite_only">Invite only</option></select></label>
          <label className="grid gap-2 sm:col-span-2"><span className="text-sm text-white">Purpose</span><textarea name="description" className="text-field" placeholder="What should this group think through or build?" minLength={20} maxLength={600} required /></label>
          <label className="grid gap-2 sm:col-span-2"><span className="text-sm text-white">Topic tags</span><input name="tags" className="text-field" placeholder="climate, research, sprint" required /><span className="text-xs text-slate-400">Add 1–6 comma-separated topics.</span></label>
          <label className="grid gap-2 sm:col-span-2"><span className="text-sm text-white">Invite classmates (optional)</span><input name="invites" className="text-field" placeholder="MU email addresses, comma-separated" /><span className="text-xs text-slate-400">We will email each MU address. They join only after accepting with that verified account.</span></label>
          {error ? <p className="sm:col-span-2 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200" role="alert">{error}</p> : null}
          <button className="primary-button sm:col-span-2" disabled={submitting}>{submitting ? "Creating group…" : "Create group"}</button>
        </form>
      )}
    </div>
  );
}

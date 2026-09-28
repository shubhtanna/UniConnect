"use client";

import { useState } from "react";

export function ViewModeControl({ initialMode }: { initialMode: "named" | "anonymous" }) {
  const [mode, setMode] = useState(initialMode);
  const [saving, setSaving] = useState(false);

  async function update(next: "named" | "anonymous") {
    const previous = mode;
    setMode(next); setSaving(true);
    const response = await fetch("/api/insights/view-mode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: next }) });
    if (!response.ok) setMode(previous);
    setSaving(false);
  }

  return <div className="flex rounded-full border border-line bg-app p-1" aria-label="Profile viewing privacy">
    {(["named", "anonymous"] as const).map((item) => <button key={item} type="button" disabled={saving} onClick={() => void update(item)} className={`rounded-full px-4 py-2 text-xs font-semibold capitalize ${mode === item ? "bg-teal/15 text-teal" : "text-muted"}`}>{item}</button>)}
  </div>;
}

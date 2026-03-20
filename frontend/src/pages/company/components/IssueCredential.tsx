import { FormEvent, useState } from "react";

type Props = {
  workerId: string;
  defaultRole: string;
  defaultAttributes: string[];
  onIssue: (payload: { worker_id: string; expires_at: string; role: string; attributes: string[] }) => void;
  busy?: boolean;
};

export function IssueCredential({ workerId, defaultRole, defaultAttributes, onIssue, busy }: Props) {
  const [role, setRole] = useState(defaultRole || "delivery");
  const [expiresAt, setExpiresAt] = useState(new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 16));
  const [attributesText, setAttributesText] = useState(defaultAttributes.join("\n"));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const attributes = attributesText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    onIssue({
      worker_id: workerId,
      expires_at: new Date(expiresAt).toISOString(),
      role,
      attributes
    });
  }

  return (
    <form className="panel grid gap-4" onSubmit={handleSubmit}>
      <h3 className="text-lg font-semibold">Issue credential</h3>
      <input className="rounded-2xl border border-black/10 px-4 py-3" value={role} onChange={(event) => setRole(event.target.value)} placeholder="Role" />
      <input className="rounded-2xl border border-black/10 px-4 py-3" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
      <textarea
        className="rounded-2xl border border-black/10 px-4 py-3"
        rows={6}
        value={attributesText}
        onChange={(event) => setAttributesText(event.target.value)}
        placeholder="One attribute per line, e.g. company:Amazon"
      />
      <button className="rounded-2xl bg-moss px-4 py-3 text-sm text-white" disabled={busy}>
        {busy ? "Issuing..." : "Issue credential"}
      </button>
    </form>
  );
}

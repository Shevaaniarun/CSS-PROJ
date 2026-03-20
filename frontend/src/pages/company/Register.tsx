import { FormEvent, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { apiClient } from "lib/api/client";

export function CompanyRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    license_id: "",
    contact_name: "",
    contact_phone: ""
  });
  const [metadata, setMetadata] = useState('{"service":"delivery"}');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await apiClient.post("/company/register", {
        ...form,
        metadata: JSON.parse(metadata)
      });
      setMessage("Company registration submitted. Your account is pending admin approval.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-shell">
      <PageHeader eyebrow="Company" title="Register company" subtitle="Submit your company details for manual trust approval before issuing credentials." />
      <form className="panel grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Company name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Contact email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="rounded-2xl border border-black/10 px-4 py-3" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="License number" value={form.license_id} onChange={(event) => setForm({ ...form, license_id: event.target.value })} />
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Contact person" value={form.contact_name} onChange={(event) => setForm({ ...form, contact_name: event.target.value })} />
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Contact phone" value={form.contact_phone} onChange={(event) => setForm({ ...form, contact_phone: event.target.value })} />
        <textarea className="rounded-2xl border border-black/10 px-4 py-3 md:col-span-2" rows={4} placeholder="Metadata JSON" value={metadata} onChange={(event) => setMetadata(event.target.value)} />
        {error ? <div className="text-sm text-ember md:col-span-2">{error}</div> : null}
        {message ? <div className="text-sm text-moss md:col-span-2">{message}</div> : null}
        <button className="rounded-2xl bg-moss px-4 py-3 text-sm text-white md:col-span-2" disabled={busy}>
          {busy ? "Submitting..." : "Register company"}
        </button>
      </form>
    </section>
  );
}

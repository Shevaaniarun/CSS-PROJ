import { FormEvent, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { apiClient } from "lib/api/client";

export function GateRegister() {
  const [form, setForm] = useState({
    name: "",
    identifier: "",
    location: "",
    institution: "",
    password: ""
  });
  const [deviceDetails, setDeviceDetails] = useState('{"device":"kiosk"}');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await apiClient.post("/gate/register", {
        ...form,
        device_details: JSON.parse(deviceDetails)
      });
      setMessage("Gate registration submitted. Once approved, the gate can log in and sync trusted company keys.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-shell">
      <PageHeader eyebrow="Gate" title="Register gate" subtitle="Register a campus gate kiosk before it can sync trust bundles and verify worker QR payloads." />
      <form className="panel grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Gate name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Gate identifier" value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} />
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Institution" value={form.institution} onChange={(event) => setForm({ ...form, institution: event.target.value })} />
        <input className="rounded-2xl border border-black/10 px-4 py-3 md:col-span-2" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <textarea className="rounded-2xl border border-black/10 px-4 py-3 md:col-span-2" rows={4} placeholder="Device details JSON" value={deviceDetails} onChange={(event) => setDeviceDetails(event.target.value)} />
        {error ? <div className="text-sm text-ember md:col-span-2">{error}</div> : null}
        {message ? <div className="text-sm text-moss md:col-span-2">{message}</div> : null}
        <button className="rounded-2xl bg-ember px-4 py-3 text-sm text-white md:col-span-2" disabled={busy}>
          {busy ? "Submitting..." : "Register gate"}
        </button>
      </form>
    </section>
  );
}

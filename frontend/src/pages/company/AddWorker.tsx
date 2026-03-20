import { PageHeader } from "../../components/PageHeader";
import { FormEvent, useState } from "react";
import { useCreateWorker } from "hooks/useCompany";
import { toast } from "sonner";

export function CompanyAddWorker() {
  const createWorker = useCreateWorker();
  const [workerId, setWorkerId] = useState("");
  const [role, setRole] = useState("delivery");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [attributesJson, setAttributesJson] = useState("{\"route\":\"campus\", \"vehicle\":\"bike\"}");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const attributes = JSON.parse(attributesJson) as Record<string, unknown>;
      setError(null);
      createWorker.mutate(
        {
          worker_id: workerId,
          role,
          full_name: fullName,
          phone,
          password,
          attributes
        },
        {
          onSuccess: () => {
            toast.success("Worker created successfully");
            setWorkerId("");
            setFullName("");
            setPhone("");
            setPassword("");
          }
        }
      );
    } catch {
      setError("Attributes must be valid JSON.");
      toast.error("Attributes must be valid JSON");
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Company" title="Add worker" subtitle="Collect worker metadata, define attributes, and initialize local authentication secrets." />
      <form className="panel grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Worker ID" value={workerId} onChange={(event) => setWorkerId(event.target.value)} />
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Role" value={role} onChange={(event) => setRole(event.target.value)} />
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <input className="rounded-2xl border border-black/10 px-4 py-3 md:col-span-2" placeholder="Temporary worker password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <textarea className="rounded-2xl border border-black/10 px-4 py-3 md:col-span-2" placeholder="Attributes JSON" rows={5} value={attributesJson} onChange={(event) => setAttributesJson(event.target.value)} />
        {error ? <div className="text-sm text-ember md:col-span-2">{error}</div> : null}
        {createWorker.isSuccess ? <div className="text-sm text-moss md:col-span-2">Worker created successfully.</div> : null}
        <button className="rounded-2xl bg-moss px-4 py-3 text-sm text-white md:col-span-2" disabled={createWorker.isPending}>
          {createWorker.isPending ? "Creating..." : "Create worker record"}
        </button>
      </form>
    </section>
  );
}

import { PageHeader } from "../../components/PageHeader";

export function CompanyAddWorker() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Company" title="Add worker" subtitle="Collect worker metadata, define attributes, and initialize local authentication secrets." />
      <form className="panel grid gap-4 md:grid-cols-2">
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Worker ID" />
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Role" />
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Full name" />
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Phone" />
        <textarea className="rounded-2xl border border-black/10 px-4 py-3 md:col-span-2" placeholder="Attributes JSON" rows={5} />
        <button className="rounded-2xl bg-moss px-4 py-3 text-sm text-white md:col-span-2">Create worker record</button>
      </form>
    </section>
  );
}

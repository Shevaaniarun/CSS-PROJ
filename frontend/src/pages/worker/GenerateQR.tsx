import { PageHeader } from "../../components/PageHeader";

export function WorkerGenerateQR() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Worker Wallet" title="Generate gate QR" subtitle="Generate a one-time pseudonym with a five-minute lifetime for the current campus entry attempt." />
      <form className="panel grid gap-4">
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Paste gate nonce" />
        <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Credential ID" />
        <textarea className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Access tree / attribute disclosure policy" rows={5} />
        <button className="rounded-2xl bg-moss px-4 py-3 text-sm text-white">Generate live QR</button>
      </form>
    </section>
  );
}

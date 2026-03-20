import { PageHeader } from "../../components/PageHeader";

export function AdminGates() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Admin" title="Gate management" subtitle="Register kiosks, review offline sync health, and rotate gate trust bundles." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <h3 className="text-lg font-semibold">Gate onboarding</h3>
          <ol className="mt-4 space-y-3 text-sm text-black/70">
            <li>1. Gate submits location, institution, and device metadata.</li>
            <li>2. Admin manually approves or rejects the gate.</li>
            <li>3. Approved gate syncs trusted company public keys.</li>
            <li>4. Revoked gate loses sync and verification privileges.</li>
          </ol>
        </div>
        <div className="panel">
          <h3 className="text-lg font-semibold">Cached trust bundle</h3>
          <p className="mt-4 text-sm text-black/70">
            Gates operate online with live syncs and offline with the most recent locally cached company keys and revocation list.
          </p>
        </div>
      </div>
    </section>
  );
}

import { PageHeader } from "../../components/PageHeader";
import { CredentialList } from "./components/CredentialList";

export function WorkerWallet() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Worker Wallet" title="Credentials stored privately on device" subtitle="Workers import credentials, inspect expiry state, and prepare one-time pseudonyms without exposing their real identity to gates." />
      <CredentialList />
    </section>
  );
}


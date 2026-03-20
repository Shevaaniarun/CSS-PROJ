import { PageHeader } from "../../components/PageHeader";
import { CredentialCard } from "./components/CredentialCard";

export function CompanyCredentials() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Company" title="Credentials" subtitle="Track issued credentials, expiries, exports, and revocation status." />
      <CredentialCard />
    </section>
  );
}


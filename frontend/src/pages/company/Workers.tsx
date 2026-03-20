import { PageHeader } from "../../components/PageHeader";
import { WorkerTable } from "./components/WorkerTable";

export function CompanyWorkers() {
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Company" title="Workers" subtitle="Register and manage worker attributes such as employer, role, route type, and service scope." />
      <WorkerTable />
    </section>
  );
}


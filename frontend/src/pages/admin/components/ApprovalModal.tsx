type ApprovalItem = {
  id: string;
  label: string;
  status: string;
  created_at: string;
};

type Props = {
  companies: ApprovalItem[];
  gates: ApprovalItem[];
  onApproveCompany: (companyId: string, approve: boolean) => void;
  busyCompanyId?: string;
};

export function ApprovalModal({ companies, gates, onApproveCompany, busyCompanyId }: Props) {
  return (
    <div className="panel">
      <h3 className="text-lg font-semibold">Approval Workflow</h3>
      <p className="mt-2 text-sm text-black/70">
        Approve or reject companies with review notes, trust policy tags, and audit log capture.
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-black/60">Pending Companies</h4>
          <div className="mt-2 space-y-2">
            {companies.length === 0 ? <div className="text-sm text-black/50">No pending companies.</div> : null}
            {companies.map((company) => (
              <div key={company.id} className="rounded-2xl border border-black/10 p-3">
                <div className="font-medium">{company.label}</div>
                <div className="text-xs text-black/50">{new Date(company.created_at).toLocaleString()}</div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-full bg-moss px-3 py-2 text-xs text-white disabled:opacity-50"
                    disabled={busyCompanyId === company.id}
                    onClick={() => onApproveCompany(company.id, true)}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-full bg-ember px-3 py-2 text-xs text-white disabled:opacity-50"
                    disabled={busyCompanyId === company.id}
                    onClick={() => onApproveCompany(company.id, false)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-black/60">Pending Gates</h4>
          <div className="mt-2 space-y-2">
            {gates.length === 0 ? <div className="text-sm text-black/50">No pending gates.</div> : null}
            {gates.map((gate) => (
              <div key={gate.id} className="rounded-2xl border border-black/10 p-3">
                <div className="font-medium">{gate.label}</div>
                <div className="text-xs text-black/50">{new Date(gate.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

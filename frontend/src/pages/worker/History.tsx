import { PageHeader } from "../../components/PageHeader";
import { useWorkerHistory } from "hooks/useWorker";

export function WorkerHistory() {
  const historyQuery = useWorkerHistory();
  return (
    <section className="space-y-6">
      <PageHeader eyebrow="Worker Wallet" title="Access history" subtitle="View gate outcomes and pseudonym usage without revealing raw credential material." />
      <div className="panel overflow-hidden">
        {(historyQuery.data ?? []).length === 0 ? (
          <div className="text-sm text-black/60">No access attempts recorded yet. Your gate scans will appear here after verification.</div>
        ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-black/50">
            <tr>
              <th className="pb-3">Time</th>
              <th className="pb-3">Gate</th>
              <th className="pb-3">Result</th>
              <th className="pb-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {(historyQuery.data ?? []).map((entry) => (
              <tr key={entry.id} className="border-t border-black/10">
                <td className="py-3">{new Date(entry.created_at).toLocaleString()}</td>
                <td className="py-3">{entry.gate_id ?? "Unknown gate"}</td>
                <td className="py-3">
                  <span className={`rounded-full px-3 py-1 text-xs ${entry.result === "grant" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {entry.result}
                  </span>
                </td>
                <td className="py-3">{entry.reason ?? "Passed all checks"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </section>
  );
}

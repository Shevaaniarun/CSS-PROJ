type Row = {
  id: string;
  created_at: string;
  gate_id: string | null;
  worker_id: string | null;
  result: string;
  reason: string | null;
};

type Props = {
  rows: Row[];
};

export function ActivityTable({ rows }: Props) {
  return (
    <div className="panel overflow-hidden">
      <h3 className="mb-4 text-lg font-semibold">Recent Access Attempts</h3>
      <table className="w-full text-left text-sm">
        <thead className="text-black/50">
          <tr>
            <th>Time</th>
            <th>Gate</th>
            <th>Actor</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-black/10">
              <td className="py-3">{new Date(row.created_at).toLocaleTimeString()}</td>
              <td className="py-3">{row.gate_id ?? "Unknown gate"}</td>
              <td className="py-3">{row.worker_id ?? "Worker hidden"}</td>
              <td className="py-3">
                {row.result}
                {row.reason ? `: ${row.reason}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

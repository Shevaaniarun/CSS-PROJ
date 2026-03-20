const rows = [
  ["08:42", "North Gate", "Amazon rider", "Granted"],
  ["08:45", "West Gate", "Swiggy rider", "Denied: replay"],
  ["08:50", "South Gate", "Blinkit rider", "Granted"]
];

export function ActivityTable() {
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
            <tr key={row.join("-")} className="border-t border-black/10">
              {row.map((value) => (
                <td key={value} className="py-3">{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


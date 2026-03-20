const stats = [
  { label: "Pending Companies", value: "07" },
  { label: "Active Gates", value: "12" },
  { label: "Daily Verifications", value: "1,248" },
  { label: "Replay Blocks", value: "03" }
];

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="panel">
          <div className="text-sm text-black/60">{stat.label}</div>
          <div className="mt-3 text-4xl font-semibold text-moss">{stat.value}</div>
        </div>
      ))}
    </div>
  );
}


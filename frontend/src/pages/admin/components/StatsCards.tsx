type Props = {
  stats: Array<{ label: string; value: string | number }>;
};

export function StatsCards({ stats }: Props) {
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

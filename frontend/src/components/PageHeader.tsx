type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export function PageHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <div className="panel">
      <p className="text-xs uppercase tracking-[0.35em] text-moss">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm text-black/70">{subtitle}</p>
    </div>
  );
}


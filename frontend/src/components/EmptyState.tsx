type Props = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="panel flex min-h-56 flex-col items-start justify-center gap-4">
      <div className="rounded-2xl bg-black/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-moss">Empty</div>
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="mt-2 max-w-2xl text-sm text-black/65">{description}</p>
      </div>
      {action}
    </div>
  );
}

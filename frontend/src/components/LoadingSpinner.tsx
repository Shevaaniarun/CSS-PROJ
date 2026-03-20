type Props = {
  label?: string;
};

export function LoadingSpinner({ label = "Loading..." }: Props) {
  return (
    <div className="panel flex items-center gap-4 text-sm text-black/70">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-black/15 border-t-moss" />
      <span>{label}</span>
    </div>
  );
}

type Props = {
  expiresAt?: string;
};

export function StatusBadge({ expiresAt }: Props) {
  const isExpired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;
  return (
    <div className={`inline-flex rounded-full px-3 py-1 text-xs text-white ${isExpired ? "bg-ember" : "bg-moss"}`}>
      {expiresAt ? (isExpired ? "Expired" : `Valid until ${new Date(expiresAt).toLocaleString()}`) : "Credential loaded"}
    </div>
  );
}

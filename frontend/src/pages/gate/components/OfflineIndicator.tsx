type Props = {
  online: boolean;
  hasCachedNonce: boolean;
};

export function OfflineIndicator({ online, hasCachedNonce }: Props) {
  return (
    <div className={`rounded-full px-3 py-1 text-xs font-medium ${online ? "bg-moss text-white" : "bg-amber-200 text-ink"}`}>
      {online ? "Gate online" : hasCachedNonce ? "Offline mode using cached nonce" : "Offline and waiting for cached nonce"}
    </div>
  );
}

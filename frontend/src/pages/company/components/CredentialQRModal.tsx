import QRCode from "react-qr-code";

type Props = {
  open: boolean;
  title: string;
  value: string;
  onClose: () => void;
};

export function CredentialQRModal({ open, title, value, onClose }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-black/60">Scan this QR to import the credential bundle into the worker wallet.</p>
          </div>
          <button className="rounded-full bg-black/5 px-3 py-2 text-sm" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-6 flex justify-center rounded-3xl bg-white p-4">
          <QRCode value={value} size={240} />
        </div>
      </div>
    </div>
  );
}

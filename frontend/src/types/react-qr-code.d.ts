declare module "react-qr-code" {
  import { ComponentType } from "react";

  const QRCode: ComponentType<{ value: string; size?: number }>;
  export default QRCode;
}

declare module "react-qr-code" {
  import { ComponentType } from "react";

  const QRCode: ComponentType<{
    value: string;
    size?: number;
    level?: "L" | "M" | "Q" | "H";
    id?: string;
  }>;
  export default QRCode;
}

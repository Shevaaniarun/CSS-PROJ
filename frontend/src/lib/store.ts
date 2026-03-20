import { create } from "zustand";

type GeneratedQrState = {
  payload: Record<string, unknown>;
  expiresAt?: string;
};

type GateVerificationState = {
  granted: boolean;
  failureReason?: string | null;
  checks: Record<string, boolean>;
  timestamp: string;
};

type AppState = {
  role: "admin" | "company" | "gate" | "worker";
  gateId: string;
  latestQr: GeneratedQrState | null;
  latestGateResult: GateVerificationState | null;
  setRole: (role: AppState["role"]) => void;
  setGateId: (gateId: string) => void;
  setLatestQr: (latestQr: GeneratedQrState | null) => void;
  setLatestGateResult: (latestGateResult: GateVerificationState | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  role: "admin",
  gateId: "",
  latestQr: null,
  latestGateResult: null,
  setRole: (role) => set({ role }),
  setGateId: (gateId) => set({ gateId }),
  setLatestQr: (latestQr) => set({ latestQr }),
  setLatestGateResult: (latestGateResult) => set({ latestGateResult })
}));

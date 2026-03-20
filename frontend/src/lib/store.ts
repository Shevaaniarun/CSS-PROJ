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
  role:
    typeof window !== "undefined" &&
    (localStorage.getItem("auth_role") === "admin" ||
      localStorage.getItem("auth_role") === "company" ||
      localStorage.getItem("auth_role") === "gate" ||
      localStorage.getItem("auth_role") === "worker")
      ? (localStorage.getItem("auth_role") as AppState["role"])
      : "admin",
  gateId: "",
  latestQr: null,
  latestGateResult: null,
  setRole: (role) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_role", role);
    }
    set({ role });
  },
  setGateId: (gateId) => set({ gateId }),
  setLatestQr: (latestQr) => set({ latestQr }),
  setLatestGateResult: (latestGateResult) => set({ latestGateResult })
}));

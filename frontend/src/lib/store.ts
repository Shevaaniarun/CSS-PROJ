import { create } from "zustand";

type AppState = {
  role: "admin" | "company" | "gate" | "worker";
  setRole: (role: AppState["role"]) => void;
};

export const useAppStore = create<AppState>((set) => ({
  role: "admin",
  setRole: (role) => set({ role })
}));


import { useMutation } from "@tanstack/react-query";
import { apiClient } from "lib/api/client";

type LoginPayload = {
  email?: string;
  identifier?: string;
  external_worker_id?: string;
  password: string;
};

type TokenResponse = {
  access_token: string;
};

export type AuthRole = "admin" | "company" | "gate" | "worker";

function persistToken(response: TokenResponse, role: AuthRole) {
  localStorage.setItem("access_token", response.access_token);
  localStorage.setItem("auth_role", role);
  return response;
}

export function hasAccessToken() {
  return typeof window !== "undefined" && Boolean(localStorage.getItem("access_token"));
}

export function getStoredRole(): AuthRole | null {
  if (typeof window === "undefined") {
    return null;
  }
  const role = localStorage.getItem("auth_role");
  return role === "admin" || role === "company" || role === "gate" || role === "worker" ? role : null;
}

export function getDefaultRouteForRole(role: AuthRole | null) {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "company":
      return "/company";
    case "gate":
      return "/gate";
    case "worker":
      return "/worker";
    default:
      return "/login";
  }
}

export function useAdminLogin() {
  return useMutation({
    mutationFn: async (payload: Required<Pick<LoginPayload, "email" | "password">>) =>
      persistToken(await apiClient.post<TokenResponse>("/admin/login", payload), "admin")
  });
}

export function useCompanyLogin() {
  return useMutation({
    mutationFn: async (payload: Required<Pick<LoginPayload, "email" | "password">>) =>
      persistToken(await apiClient.post<TokenResponse>("/company/auth", payload), "company")
  });
}

export function useGateLogin() {
  return useMutation({
    mutationFn: async (payload: Required<Pick<LoginPayload, "identifier" | "password">>) =>
      persistToken(await apiClient.post<TokenResponse>("/gate/auth", payload), "gate")
  });
}

export function useWorkerLogin() {
  return useMutation({
    mutationFn: async (payload: Required<Pick<LoginPayload, "external_worker_id" | "password">>) =>
      persistToken(await apiClient.post<TokenResponse>("/worker/auth", payload), "worker")
  });
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("auth_role");
}

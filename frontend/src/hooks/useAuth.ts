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

function persistToken(response: TokenResponse) {
  localStorage.setItem("access_token", response.access_token);
  return response;
}

export function useAdminLogin() {
  return useMutation({
    mutationFn: async (payload: Required<Pick<LoginPayload, "email" | "password">>) =>
      persistToken(await apiClient.post<TokenResponse>("/admin/login", payload))
  });
}

export function useCompanyLogin() {
  return useMutation({
    mutationFn: async (payload: Required<Pick<LoginPayload, "email" | "password">>) =>
      persistToken(await apiClient.post<TokenResponse>("/company/auth", payload))
  });
}

export function useGateLogin() {
  return useMutation({
    mutationFn: async (payload: Required<Pick<LoginPayload, "identifier" | "password">>) =>
      persistToken(await apiClient.post<TokenResponse>("/gate/auth", payload))
  });
}

export function useWorkerLogin() {
  return useMutation({
    mutationFn: async (payload: Required<Pick<LoginPayload, "external_worker_id" | "password">>) =>
      persistToken(await apiClient.post<TokenResponse>("/worker/auth", payload))
  });
}

export function logout() {
  localStorage.removeItem("access_token");
}

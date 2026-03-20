import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "lib/api/client";

function hasToken() {
  return typeof window !== "undefined" && Boolean(localStorage.getItem("access_token"));
}

export type GateStatus = {
  id: string;
  name: string;
  identifier: string;
  location: string;
  status: string;
  timestamp: string;
};

export type NonceResponse = {
  gate_id: string;
  nonce: string;
  expires_at: string;
};

export type VerificationResult = {
  granted: boolean;
  signature_verified: boolean;
  expiry_check_passed: boolean;
  timestamp_check_passed: boolean;
  nonce_check_passed: boolean;
  trust_check_passed: boolean;
  revocation_check_passed: boolean;
  replay_check_passed: boolean;
  failure_reason: string | null;
  pseudonym_id?: string;
};

export function useGateStatus() {
  return useQuery({
    queryKey: ["gate", "status"],
    queryFn: () => apiClient.get<GateStatus>("/gate/status"),
    refetchInterval: 5000,
    enabled: hasToken()
  });
}

export function useGateNonce() {
  return useMutation({
    mutationFn: (gateId: string) => apiClient.post<NonceResponse>("/gate/nonce", { gate_id: gateId })
  });
}

export function useGateVerify() {
  return useMutation({
    mutationFn: (payload: {
      gate_id: string;
      gate_nonce: string;
      received_nonce: string;
      timestamp: string;
      qr_data: Record<string, unknown>;
    }) => apiClient.post<VerificationResult>("/gate/verify", payload)
  });
}

export function useGateSync() {
  return useMutation({
    mutationFn: (gateId: string) => apiClient.post<Record<string, unknown>>("/gate/sync", { gate_id: gateId })
  });
}

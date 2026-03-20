import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "lib/api/client";
import { StoredCredential, loadStoredCredentials, saveStoredCredentials, upsertStoredCredential } from "lib/secureStorage";

function hasToken() {
  return typeof window !== "undefined" && Boolean(localStorage.getItem("access_token"));
}

export type WorkerHistoryEntry = {
  id: string;
  result: string;
  reason: string | null;
  gate_id: string | null;
  created_at: string;
};

export type GeneratedQrPayload = Record<string, unknown> & {
  pseudonym_id?: string;
  credential_id?: string;
};

export function useStoredCredentials() {
  return useQuery({
    queryKey: ["worker", "stored-credentials"],
    queryFn: async () => loadStoredCredentials(),
    staleTime: Infinity
  });
}

export function useImportCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credential: StoredCredential) => upsertStoredCredential(credential),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["worker", "stored-credentials"] });
    }
  });
}

export function useRemoveCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentialId: string) => {
      const current = loadStoredCredentials().filter((credential) => credential.id !== credentialId);
      saveStoredCredentials(current);
      return current;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["worker", "stored-credentials"] });
    }
  });
}

export function useGeneratePseudonym() {
  return useMutation({
    mutationFn: (payload: {
      credential_id: string;
      gate_nonce: string;
      own_attributes: string[];
      delegated_attributes: Record<string, number>;
      simulated_attributes: Record<string, number>;
      access_tree: Record<string, unknown>;
      message: Record<string, unknown>;
    }) => apiClient.post<GeneratedQrPayload>("/worker/pseudonym/generate", payload)
  });
}

export function useWorkerHistory() {
  return useQuery({
    queryKey: ["worker", "history"],
    queryFn: () => apiClient.get<WorkerHistoryEntry[]>("/worker/history"),
    refetchInterval: 10000,
    enabled: hasToken()
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "lib/api/client";

function hasToken() {
  return typeof window !== "undefined" && Boolean(localStorage.getItem("access_token"));
}

export type AdminStats = {
  total_attempts: number;
  granted: number;
  denied: number;
  pending_companies: number;
  pending_gates: number;
};

export type AccessLog = {
  id: string;
  gate_id: string | null;
  worker_id: string | null;
  result: string;
  reason: string | null;
  created_at: string;
};

export type CompanySummary = {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
};

export type GateSummary = {
  id: string;
  name: string;
  identifier: string;
  location: string;
  status: string;
  created_at: string;
};

export type WorkerSummary = {
  id: string;
  company_id: string;
  full_name: string;
  phone: string;
  external_worker_id: string;
  status: string;
  attributes: Record<string, unknown>;
};

export type AuditLog = {
  id: string;
  actor_type: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  created_at: string;
};

export type CreateWorkerPayload = {
  worker_id: string;
  full_name: string;
  phone: string;
  password: string;
  role: string;
  attributes: Record<string, unknown>;
};

export type IssueCredentialPayload = {
  worker_id: string;
  expires_at: string;
  role: string;
  attributes: string[];
};

export type CredentialSummary = {
  id: string;
  worker_id: string;
  worker_name: string | null;
  external_worker_id: string | null;
  expires_at: string;
  created_at: string;
  credential_blob: Record<string, unknown>;
};

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiClient.get<AdminStats>("/admin/stats"),
    refetchInterval: 5000,
    enabled: hasToken()
  });
}

export function useAccessLogs() {
  return useQuery({
    queryKey: ["admin", "access-logs"],
    queryFn: () => apiClient.get<AccessLog[]>("/admin/access-logs"),
    refetchInterval: 5000,
    enabled: hasToken()
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => apiClient.get<AuditLog[]>("/admin/audit-logs"),
    enabled: hasToken()
  });
}

export function usePendingCompanies() {
  return useQuery({
    queryKey: ["admin", "pending-companies"],
    queryFn: () => apiClient.get<CompanySummary[]>("/admin/pending-companies"),
    refetchInterval: 5000,
    enabled: hasToken()
  });
}

export function usePendingGates() {
  return useQuery({
    queryKey: ["admin", "pending-gates"],
    queryFn: () => apiClient.get<GateSummary[]>("/admin/pending-gates"),
    refetchInterval: 5000,
    enabled: hasToken()
  });
}

export function useApproveCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, approve, notes }: { companyId: string; approve: boolean; notes?: string }) =>
      apiClient.post<{ message: string }>(`/admin/approve-company/${companyId}`, { approve, notes }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "pending-companies"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
      ]);
    }
  });
}

export function useApproveGate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ gateId, approve, notes }: { gateId: string; approve: boolean; notes?: string }) =>
      apiClient.post<{ message: string }>(`/admin/approve-gate/${gateId}`, { approve, notes }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "pending-gates"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
      ]);
    }
  });
}

export function useWorkers() {
  return useQuery({
    queryKey: ["company", "workers"],
    queryFn: () => apiClient.get<WorkerSummary[]>("/company/workers"),
    enabled: hasToken()
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkerPayload) => apiClient.post<WorkerSummary>("/company/workers", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["company", "workers"] });
    }
  });
}

export function useIssueCredential() {
  return useMutation({
    mutationFn: (payload: IssueCredentialPayload) =>
      apiClient.post<{ message: string }>("/company/credentials/issue", payload)
  });
}

export function useRevokeWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workerId: string) => apiClient.post<{ message: string }>(`/company/workers/${workerId}/revoke`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["company", "workers"] });
    }
  });
}

export function useCredentials() {
  return useQuery({
    queryKey: ["company", "credentials"],
    queryFn: () => apiClient.get<CredentialSummary[]>("/company/credentials"),
    enabled: hasToken()
  });
}

export function useCredential(credentialId?: string) {
  return useQuery({
    queryKey: ["company", "credentials", credentialId],
    queryFn: () => apiClient.get<CredentialSummary>(`/company/credentials/${credentialId}`),
    enabled: hasToken() && Boolean(credentialId)
  });
}

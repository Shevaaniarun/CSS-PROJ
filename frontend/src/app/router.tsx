import { ReactNode, useEffect, useState } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { LoginPage } from "../pages/Login";
import { AdminDashboard } from "../pages/admin/Dashboard";
import { AdminCompanies } from "../pages/admin/Companies";
import { AdminGates } from "../pages/admin/Gates";
import { AdminAuditLogs } from "../pages/admin/AuditLogs";
import { CompanyDashboard } from "../pages/company/Dashboard";
import { CompanyWorkers } from "../pages/company/Workers";
import { CompanyAddWorker } from "../pages/company/AddWorker";
import { CompanyWorkerDetail } from "../pages/company/WorkerDetail";
import { CompanyCredentials } from "../pages/company/Credentials";
import { GateScanner } from "../pages/gate/Scanner";
import { GateVerificationResult } from "../pages/gate/VerificationResult";
import { GateManualEntry } from "../pages/gate/ManualEntry";
import { WorkerWallet } from "../pages/worker/Wallet";
import { WorkerCredentialDetail } from "../pages/worker/CredentialDetail";
import { WorkerGenerateQR } from "../pages/worker/GenerateQR";
import { WorkerQRDisplay } from "../pages/worker/QRDisplay";
import { WorkerHistory } from "../pages/worker/History";
import { getDefaultRouteForRole, getStoredRole, hasAccessToken } from "hooks/useAuth";

export function ProtectedShell({ children }: { children?: ReactNode }) {
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setChecking(false), 100);
    return () => window.clearTimeout(timer);
  }, []);

  if (checking) {
    return <div className="page-shell"><div className="panel text-sm">Checking session...</div></div>;
  }

  if (!hasAccessToken()) {
    return <Navigate to="/login" replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}

function RequireRole({ role, children }: { role: "admin" | "company" | "gate" | "worker"; children: ReactNode }) {
  const storedRole = getStoredRole();
  if (storedRole !== role) {
    return <Navigate to={getDefaultRouteForRole(storedRole)} replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/",
    element: <ProtectedShell><AppLayout /></ProtectedShell>,
    children: [
      { index: true, element: <Navigate to={getDefaultRouteForRole(getStoredRole())} replace /> },
      { path: "admin", element: <Navigate to="/admin/dashboard" replace /> },
      { path: "admin/dashboard", element: <RequireRole role="admin"><AdminDashboard /></RequireRole> },
      { path: "admin/companies", element: <RequireRole role="admin"><AdminCompanies /></RequireRole> },
      { path: "admin/gates", element: <RequireRole role="admin"><AdminGates /></RequireRole> },
      { path: "admin/audit-logs", element: <RequireRole role="admin"><AdminAuditLogs /></RequireRole> },
      { path: "company", element: <RequireRole role="company"><CompanyDashboard /></RequireRole> },
      { path: "company/register", element: <Navigate to="/register/company" replace /> },
      { path: "company/workers", element: <RequireRole role="company"><CompanyWorkers /></RequireRole> },
      { path: "company/workers/new", element: <RequireRole role="company"><CompanyAddWorker /></RequireRole> },
      { path: "company/workers/:id", element: <RequireRole role="company"><CompanyWorkerDetail /></RequireRole> },
      { path: "company/credentials", element: <RequireRole role="company"><CompanyCredentials /></RequireRole> },
      { path: "gate", element: <RequireRole role="gate"><GateScanner /></RequireRole> },
      { path: "gate/register", element: <Navigate to="/register/gate" replace /> },
      { path: "gate/result", element: <RequireRole role="gate"><GateVerificationResult /></RequireRole> },
      { path: "gate/manual-entry", element: <RequireRole role="gate"><GateManualEntry /></RequireRole> },
      { path: "worker", element: <RequireRole role="worker"><WorkerWallet /></RequireRole> },
      { path: "worker/credentials/:id", element: <RequireRole role="worker"><WorkerCredentialDetail /></RequireRole> },
      { path: "worker/generate-qr", element: <RequireRole role="worker"><WorkerGenerateQR /></RequireRole> },
      { path: "worker/qr-display", element: <RequireRole role="worker"><WorkerQRDisplay /></RequireRole> },
      { path: "worker/history", element: <RequireRole role="worker"><WorkerHistory /></RequireRole> }
    ]
  },
  {
    path: "/register/company",
    lazy: async () => {
      const module = await import("../pages/company/Register");
      return { Component: module.CompanyRegister };
    }
  },
  {
    path: "/register/gate",
    lazy: async () => {
      const module = await import("../pages/gate/Register");
      return { Component: module.GateRegister };
    }
  }
]);

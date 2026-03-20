import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { AdminDashboard } from "../pages/admin/Dashboard";
import { AdminCompanies } from "../pages/admin/Companies";
import { AdminCompanyDetail } from "../pages/admin/CompanyDetail";
import { AdminGates } from "../pages/admin/Gates";
import { AdminAuditLogs } from "../pages/admin/AuditLogs";
import { AdminSettings } from "../pages/admin/Settings";
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

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/admin" replace /> },
      { path: "admin", element: <AdminDashboard /> },
      { path: "admin/companies", element: <AdminCompanies /> },
      { path: "admin/companies/:id", element: <AdminCompanyDetail /> },
      { path: "admin/gates", element: <AdminGates /> },
      { path: "admin/audit-logs", element: <AdminAuditLogs /> },
      { path: "admin/settings", element: <AdminSettings /> },
      { path: "company", element: <CompanyDashboard /> },
      { path: "company/workers", element: <CompanyWorkers /> },
      { path: "company/workers/new", element: <CompanyAddWorker /> },
      { path: "company/workers/:id", element: <CompanyWorkerDetail /> },
      { path: "company/credentials", element: <CompanyCredentials /> },
      { path: "gate", element: <GateScanner /> },
      { path: "gate/result", element: <GateVerificationResult /> },
      { path: "gate/manual-entry", element: <GateManualEntry /> },
      { path: "worker", element: <WorkerWallet /> },
      { path: "worker/credentials/:id", element: <WorkerCredentialDetail /> },
      { path: "worker/generate-qr", element: <WorkerGenerateQR /> },
      { path: "worker/qr-display", element: <WorkerQRDisplay /> },
      { path: "worker/history", element: <WorkerHistory /> }
    ]
  }
]);


import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getStoredRole, logout } from "../hooks/useAuth";
import { useAppStore } from "../lib/store";

const linksByRole = {
  admin: [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/companies", label: "Companies" },
    { to: "/admin/gates", label: "Gates" },
    { to: "/admin/audit-logs", label: "Audit Logs" },
    { to: "/admin/settings", label: "Settings" }
  ],
  company: [
    { to: "/company", label: "Dashboard" },
    { to: "/company/workers", label: "Workers" },
    { to: "/company/workers/new", label: "Add Worker" },
    { to: "/company/credentials", label: "Credentials" }
  ],
  gate: [
    { to: "/gate", label: "Scanner" },
    { to: "/gate/result", label: "Result" },
    { to: "/gate/manual-entry", label: "Manual Entry" }
  ],
  worker: [
    { to: "/worker", label: "Wallet" },
    { to: "/worker/generate-qr", label: "Generate QR" },
    { to: "/worker/qr-display", label: "QR Display" },
    { to: "/worker/history", label: "History" }
  ]
} as const;

export function AppLayout() {
  const { role, setRole } = useAppStore();
  const navigate = useNavigate();
  const storedRole = getStoredRole() ?? role;
  const navLinks = linksByRole[storedRole];

  return (
    <div className="page-shell">
      <header className="panel flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Campus Privacy Auth</p>
          <h1 className="text-3xl font-semibold text-ink">Privacy-preserving delivery access</h1>
          <p className="mt-2 text-sm text-black/60">Signed in as {storedRole}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-full bg-white px-4 py-2 text-sm"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <nav className="flex gap-3 overflow-auto">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm ${isActive ? "bg-ember text-white" : "bg-white/80"}`
            }
            to={link.to}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}

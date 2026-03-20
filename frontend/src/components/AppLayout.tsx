import { NavLink, Outlet } from "react-router-dom";
import { useAppStore } from "../lib/store";

const links = [
  { to: "/admin", label: "Admin" },
  { to: "/company", label: "Company" },
  { to: "/gate", label: "Gate" },
  { to: "/worker", label: "Worker" }
];

export function AppLayout() {
  const { role, setRole } = useAppStore();

  return (
    <div className="page-shell">
      <header className="panel flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-moss">Campus Privacy Auth</p>
          <h1 className="text-3xl font-semibold text-ink">Privacy-preserving delivery access</h1>
        </div>
        <div className="flex items-center gap-3">
          {(["admin", "company", "gate", "worker"] as const).map((value) => (
            <button
              key={value}
              className={`rounded-full px-4 py-2 text-sm ${role === value ? "bg-moss text-white" : "bg-white"}`}
              onClick={() => setRole(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </header>
      <nav className="flex gap-3 overflow-auto">
        {links.map((link) => (
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


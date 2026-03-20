import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  getDefaultRouteForRole,
  getStoredRole,
  hasAccessToken,
  useAdminLogin,
  useCompanyLogin,
  useGateLogin,
  useWorkerLogin
} from "hooks/useAuth";

type LoginMode = "admin" | "company" | "gate" | "worker";

const modes: Array<{ id: LoginMode; label: string; hint: string }> = [
  { id: "admin", label: "Admin Login", hint: "Use the seeded super admin to approve companies and gates." },
  { id: "company", label: "Company Login", hint: "Issue credentials and manage worker onboarding." },
  { id: "gate", label: "Gate Login", hint: "Scan QR payloads and verify pseudonyms." },
  { id: "worker", label: "Worker Login", hint: "Import credentials and generate live pseudonyms." }
];

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>("admin");
  const [identifier, setIdentifier] = useState("admin@campus.local");
  const [password, setPassword] = useState("secret123");
  const [error, setError] = useState<string | null>(null);

  const adminLogin = useAdminLogin();
  const companyLogin = useCompanyLogin();
  const gateLogin = useGateLogin();
  const workerLogin = useWorkerLogin();

  const activeMutation = useMemo(() => {
    switch (mode) {
      case "admin":
        return adminLogin;
      case "company":
        return companyLogin;
      case "gate":
        return gateLogin;
      case "worker":
        return workerLogin;
    }
  }, [adminLogin, companyLogin, gateLogin, workerLogin, mode]);

  if (hasAccessToken()) {
    return <Navigate to={getDefaultRouteForRole(getStoredRole())} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      if (mode === "admin") {
        await adminLogin.mutateAsync({ email: identifier, password });
      } else if (mode === "company") {
        await companyLogin.mutateAsync({ email: identifier, password });
      } else if (mode === "gate") {
        await gateLogin.mutateAsync({ identifier, password });
      } else {
        await workerLogin.mutateAsync({ external_worker_id: identifier, password });
      }
      navigate(getDefaultRouteForRole(mode));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed");
    }
  }

  return (
    <section className="page-shell">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel">
          <p className="text-xs uppercase tracking-[0.35em] text-moss">Campus Privacy Auth</p>
          <h1 className="mt-2 text-4xl font-semibold text-ink">Privacy-preserving access login</h1>
          <p className="mt-4 text-sm text-black/70">
            Sign in as admin, company, gate, or worker to enter the part of the system that matches your role.
          </p>
          <div className="mt-6 rounded-3xl bg-black/5 p-4 text-sm text-black/70">
            Development default admin:
            <div className="mt-2 font-medium text-black">admin@campus.local / secret123</div>
          </div>
        </div>
        <form className="panel space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-2 md:grid-cols-2">
            {modes.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`rounded-2xl px-4 py-3 text-left text-sm ${mode === item.id ? "bg-moss text-white" : "bg-black/5"}`}
                onClick={() => {
                  setMode(item.id);
                  setIdentifier(item.id === "admin" ? "admin@campus.local" : "");
                  setPassword(item.id === "admin" ? "secret123" : "");
                }}
              >
                <div className="font-semibold">{item.label}</div>
                <div className={`mt-1 text-xs ${mode === item.id ? "text-white/80" : "text-black/55"}`}>{item.hint}</div>
              </button>
            ))}
          </div>
          <div className="grid gap-4">
            <input
              className="rounded-2xl border border-black/10 px-4 py-3"
              placeholder={mode === "gate" ? "Gate identifier" : mode === "worker" ? "Worker ID" : "Email"}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
            />
            <input
              className="rounded-2xl border border-black/10 px-4 py-3"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-ember">{error}</div> : null}
          <button className="w-full rounded-2xl bg-ember px-4 py-3 text-sm text-white" disabled={activeMutation.isPending}>
            {activeMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="rounded-full bg-black/5 px-4 py-2" to="/register/company">
              Register company
            </Link>
            <Link className="rounded-full bg-black/5 px-4 py-2" to="/register/gate">
              Register gate
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}

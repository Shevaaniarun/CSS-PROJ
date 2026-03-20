import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "../src/pages/Login";

const adminMutate = vi.fn().mockResolvedValue({ access_token: "token" });
const companyMutate = vi.fn().mockResolvedValue({ access_token: "token" });
const gateMutate = vi.fn().mockResolvedValue({ access_token: "token" });
const workerMutate = vi.fn().mockResolvedValue({ access_token: "token" });
const navigateSpy = vi.fn();

vi.mock("hooks/useAuth", () => ({
  hasAccessToken: () => false,
  getStoredRole: () => null,
  getDefaultRouteForRole: (role: string | null) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "company") return "/company";
    if (role === "gate") return "/gate";
    if (role === "worker") return "/worker";
    return "/login";
  },
  useAdminLogin: () => ({ mutateAsync: adminMutate, isPending: false }),
  useCompanyLogin: () => ({ mutateAsync: companyMutate, isPending: false }),
  useGateLogin: () => ({ mutateAsync: gateMutate, isPending: false }),
  useWorkerLogin: () => ({ mutateAsync: workerMutate, isPending: false })
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateSpy
  };
});

describe("LoginPage", () => {
  beforeEach(() => {
    adminMutate.mockClear();
    companyMutate.mockClear();
    gateMutate.mockClear();
    workerMutate.mockClear();
    navigateSpy.mockClear();
  });

  it("logs in as admin", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(adminMutate).toHaveBeenCalledWith({
      email: "admin@campus.local",
      password: "secret123"
    });
  });

  it("submits gate credentials when gate tab is selected", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /gate login/i }));
    fireEvent.change(screen.getByPlaceholderText("Gate identifier"), { target: { value: "gate-01" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "pass123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(gateMutate).toHaveBeenCalledWith({
      identifier: "gate-01",
      password: "pass123"
    });
  });
});

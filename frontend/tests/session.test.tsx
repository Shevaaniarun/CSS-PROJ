import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedShell } from "../src/app/router";

const hasAccessTokenMock = vi.fn();

vi.mock("hooks/useAuth", async () => {
  const actual = await vi.importActual<typeof import("../src/hooks/useAuth")>("../src/hooks/useAuth");
  return {
    ...actual,
    hasAccessToken: () => hasAccessTokenMock(),
    getStoredRole: () => "admin",
    getDefaultRouteForRole: () => "/admin/dashboard"
  };
});

describe("ProtectedShell", () => {
  beforeEach(() => {
    hasAccessTokenMock.mockReset();
  });

  it("renders children when a token exists", async () => {
    hasAccessTokenMock.mockReturnValue(true);
    render(
      <MemoryRouter>
        <ProtectedShell>
          <div>Protected content</div>
        </ProtectedShell>
      </MemoryRouter>
    );

    expect(await screen.findByText("Protected content")).toBeInTheDocument();
  });
});

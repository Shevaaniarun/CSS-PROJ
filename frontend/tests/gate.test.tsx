import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GateScanner } from "../src/pages/gate/Scanner";
import { GateManualEntry } from "../src/pages/gate/ManualEntry";

const nonceMutateAsync = vi.fn().mockResolvedValue({ nonce: "nonce-1" });
const verifyMutateAsync = vi.fn().mockResolvedValue({
  granted: true,
  failure_reason: null,
  signature_verified: true,
  expiry_check_passed: true,
  timestamp_check_passed: true,
  nonce_check_passed: true,
  trust_check_passed: true,
  revocation_check_passed: true,
  replay_check_passed: true
});

vi.mock("hooks/useGate", () => ({
  useGateStatus: () => ({ data: { status: "approved" } }),
  useGateNonce: () => ({ mutateAsync: nonceMutateAsync }),
  useGateVerify: () => ({ mutateAsync: verifyMutateAsync, isPending: false }),
  useGateSync: () => ({ mutate: vi.fn() })
}));

vi.mock("lib/store", () => ({
  useAppStore: () => ({
    gateId: "gate-1",
    setGateId: vi.fn(),
    setLatestGateResult: vi.fn(),
    latestGateResult: null
  })
}));

describe("Gate flows", () => {
  beforeEach(() => {
    nonceMutateAsync.mockClear();
    verifyMutateAsync.mockClear();
  });

  it("fetches nonce from scanner", async () => {
    render(
      <MemoryRouter>
        <GateScanner />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /get nonce/i }));
    expect(nonceMutateAsync).toHaveBeenCalled();
  });

  it("submits manual entry", async () => {
    render(
      <MemoryRouter>
        <GateManualEntry />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText(/gate nonce/i), { target: { value: "nonce-1" } });
    fireEvent.change(screen.getByPlaceholderText(/pseudonym pu/i), { target: { value: "pu-value" } });
    fireEvent.click(screen.getByRole("button", { name: /submit manual verification/i }));
    expect(verifyMutateAsync).toHaveBeenCalled();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkerWallet } from "../src/pages/worker/Wallet";
import { WorkerGenerateQR } from "../src/pages/worker/GenerateQR";

const importMutate = vi.fn();
const removeMutate = vi.fn();
const generateMutate = vi.fn().mockResolvedValue({ pseudonym: "data" });
const setLatestQr = vi.fn();

vi.mock("hooks/useWorker", () => ({
  useStoredCredentials: () => ({
    data: [
      {
        id: "cred-1",
        credentialId: "cred-1",
        company: "Amazon",
        role: "delivery",
        expiry: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        importedAt: new Date().toISOString(),
        blob: { company: "Amazon", role: "delivery", expiry: new Date().toISOString(), credential_id: "cred-1" }
      }
    ],
    isLoading: false
  }),
  useImportCredential: () => ({ mutate: importMutate, isPending: false }),
  useRemoveCredential: () => ({ mutate: removeMutate }),
  useGeneratePseudonym: () => ({ mutateAsync: generateMutate, isPending: false, isSuccess: false })
}));

vi.mock("lib/store", () => ({
  useAppStore: () => ({
    setLatestQr
  })
}));

describe("Worker flows", () => {
  beforeEach(() => {
    importMutate.mockClear();
    generateMutate.mockClear();
    setLatestQr.mockClear();
  });

  it("imports valid credential JSON", () => {
    render(
      <MemoryRouter>
        <WorkerWallet />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/paste credential json/i), {
      target: {
        value: JSON.stringify({
          credential_id: "cred-2",
          company: "Swiggy",
          role: "delivery",
          expiry: new Date().toISOString()
        })
      }
    });
    fireEvent.click(screen.getByRole("button", { name: /import credential/i }));
    expect(importMutate).toHaveBeenCalled();
  });

  it("generates QR payload", async () => {
    render(
      <MemoryRouter>
        <WorkerGenerateQR />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/paste gate nonce/i), { target: { value: "nonce-1" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "cred-1" } });
    fireEvent.click(screen.getByRole("button", { name: /generate live qr/i }));

    expect(generateMutate).toHaveBeenCalled();
  });
});

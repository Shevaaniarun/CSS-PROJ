import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CompanyAddWorker } from "../src/pages/company/AddWorker";
import { CompanyWorkerDetail } from "../src/pages/company/WorkerDetail";

const createMutate = vi.fn();
const issueMutate = vi.fn();
const revokeMutate = vi.fn();

vi.mock("hooks/useCompany", () => ({
  useCreateWorker: () => ({ mutate: createMutate, isPending: false, isSuccess: false }),
  useWorkers: () => ({
    data: [
      {
        id: "worker-1",
        full_name: "Worker One",
        phone: "9999999999",
        external_worker_id: "ext-1",
        status: "active",
        attributes: { role: "delivery", company: "Amazon" }
      }
    ]
  }),
  useIssueCredential: () => ({ mutate: issueMutate, isPending: false, isSuccess: false }),
  useRevokeWorker: () => ({ mutate: revokeMutate, isPending: false })
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "worker-1" })
  };
});

describe("Company flows", () => {
  beforeEach(() => {
    createMutate.mockClear();
    issueMutate.mockClear();
    revokeMutate.mockClear();
  });

  it("submits worker creation form", () => {
    render(
      <MemoryRouter>
        <CompanyAddWorker />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText(/worker id/i), { target: { value: "worker-1" } });
    fireEvent.change(screen.getByPlaceholderText(/temporary worker password/i), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: /create worker record/i }));
    expect(createMutate).toHaveBeenCalled();
  });

  it("shows issue credential button on worker detail", () => {
    render(
      <MemoryRouter>
        <CompanyWorkerDetail />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /issue credential/i }));
    expect(issueMutate).toHaveBeenCalled();
  });
});

// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminRequest } from "../../../services/adminRequests";
import { CheckoutOperationsApi } from "./CheckoutOperationsApi";
import { ReturnOperationsApi } from "./ReturnOperationsApi";

const baseItem = {
  type: "material" as const,
  detail: null,
  quantity: 1,
  updatedAt: "2026-11-02T09:00:00-03:00",
  refusalReason: null,
};
const request: AdminRequest = {
  id: "42",
  protocol: "CCT-2026-00042",
  semester: "2026.2",
  createdAt: "2026-10-29T09:00:00-03:00",
  date: "2026-11-02",
  room: { value: "1", label: "J-201" },
  pickupTime: "09:00",
  returnTime: "11:00",
  notes: null,
  requester: { name: "Professora Ana", registration: "123", roleLabel: "Professor" },
  items: [
    { ...baseItem, id: "7", name: "Projetor", status: "APROVADO", statusLabel: "Aprovado" },
    { ...baseItem, id: "8", name: "Notebook", status: "PENDENTE", statusLabel: "Pendente" },
    { ...baseItem, id: "9", name: "Cabo HDMI", status: "RETIRADO", statusLabel: "Em posse" },
    { ...baseItem, id: "10", name: "Chave J-201", type: "key" as const, status: "ATRASADO", statusLabel: "Em atraso" },
  ],
};
const movement = (itemId: string, itemName: string, type: string) => ({
  id: `m-${itemId}`,
  type,
  requestId: "42",
  itemId,
  itemName,
  responsible: "Professora Ana",
  registeredBy: "Secretaria",
  registeredAt: "2026-11-02T09:30:00-03:00",
  notes: null,
});
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.stubEnv("VITE_API_URL", "http://localhost:3000");
  sessionStorage.setItem("unicheck_token", "token-teste");
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Retirada pela API (tela 10)", () => {
  it("lista só itens aprovados e registra a retirada com termo aceito", async () => {
    fetchMock
      .mockResolvedValueOnce(response([request]))
      .mockResolvedValueOnce(response(movement("7", "Projetor", "withdrawal")))
      .mockResolvedValueOnce(response([]));
    render(<CheckoutOperationsApi />);

    expect(await screen.findByText("Projetor")).toBeTruthy();
    expect(screen.queryByText("Notebook")).toBeNull();
    expect(screen.queryByText("Cabo HDMI")).toBeNull();

    const submit = screen.getByRole("button", { name: /Confirmar Retirada/ });
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("checkbox", { name: /Projetor/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /termo de responsabilidade/ }));
    expect((submit as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(submit);

    expect(await screen.findByText("Retirada registrada")).toBeTruthy();
    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe("http://localhost:3000/movimentacoes/retiradas");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      requestId: "42",
      itemId: "7",
      termAccepted: true,
    });
    expect(options.headers.Authorization).toBe("Bearer token-teste");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  });

  it("mostra a mensagem do servidor quando a retirada é recusada", async () => {
    fetchMock
      .mockResolvedValueOnce(response([request]))
      .mockResolvedValueOnce(
        response({ message: "A retirada só pode ser registrada no dia de utilização (2026-11-02)." }, 409),
      );
    render(<CheckoutOperationsApi />);
    await screen.findByText("Projetor");
    fireEvent.click(screen.getByRole("checkbox", { name: /Projetor/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /termo de responsabilidade/ }));
    fireEvent.click(screen.getByRole("button", { name: /Confirmar Retirada/ }));
    expect((await screen.findByRole("alert")).textContent).toContain("dia de utilização");
  });
});

describe("Devolução pela API (tela 11)", () => {
  it("lista itens em posse e registra a devolução com a condição na observação", async () => {
    fetchMock
      .mockResolvedValueOnce(response([request]))
      .mockResolvedValueOnce(response({ ...movement("10", "Chave J-201", "return"), wasLate: true }))
      .mockResolvedValueOnce(response([]));
    render(<ReturnOperationsApi />);

    expect(await screen.findByText("Chave J-201")).toBeTruthy();
    expect(screen.getByText("Cabo HDMI")).toBeTruthy();
    expect(screen.queryByText("Projetor")).toBeNull();

    const confirm = screen.getByRole("button", { name: /Confirmar Devolução/ });
    fireEvent.click(screen.getByRole("checkbox", { name: /Chave J-201/ }));
    const selects = screen.getAllByLabelText("Condição de devolução");
    fireEvent.change(selects[1], { target: { value: "AVARIADO" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Homologo/ }));
    expect((confirm as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(confirm);

    expect(await screen.findByText("Devolução registrada.")).toBeTruthy();
    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe("http://localhost:3000/movimentacoes/devolucoes");
    expect(JSON.parse(options.body)).toEqual({
      requestId: "42",
      itemId: "10",
      notes: "Condição: Avariado",
    });
    expect(screen.getByText(/1 item\(ns\) em atraso/)).toBeTruthy();
  });

  it("bloqueia a confirmação enquanto algum item marcado está sem condição", async () => {
    fetchMock.mockResolvedValueOnce(response([request]));
    render(<ReturnOperationsApi />);
    await screen.findByText("Cabo HDMI");
    fireEvent.click(screen.getByRole("checkbox", { name: /Cabo HDMI/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Homologo/ }));
    const confirm = screen.getByRole("button", { name: /Confirmar Devolução/ });
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
  });
});

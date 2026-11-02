// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OverdueAlertsApi } from "./OverdueAlertsApi";

const keyAlert = {
  id: "4",
  requestId: "1005",
  protocol: "CCT-2026-01005",
  itemId: "1008",
  itemName: "Chave J-201 · Primária",
  itemType: "key",
  room: "J-201",
  keyType: "Primária",
  requester: "Lucas Almeida",
  registration: "2412001",
  contact: null,
  withdrawnAt: "2026-10-05T10:20:00-03:00",
  dueDate: "2026-10-05",
  dueTime: "18:00",
  createdAt: "2026-10-05T22:41:00-03:00",
  resolvedAt: null,
  status: "open",
};
const materialAlert = {
  ...keyAlert,
  id: "1",
  itemId: "1004",
  itemName: "Projetor Epson WXGA",
  itemType: "material",
  room: null,
  keyType: null,
  contact: "85 99999-0000",
};
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

describe("Tela 12 conectada", () => {
  it("mostra responsável, contato, sala, tipo da chave e horários", async () => {
    fetchMock.mockImplementation(async () =>
      response([keyAlert, materialAlert]),
    );
    render(<OverdueAlertsApi onRegisterReturn={() => undefined} />);

    expect(await screen.findByText("Chave J-201 · Primária")).toBeTruthy();
    expect(screen.getAllByText(/Lucas Almeida · 2412001/)).toHaveLength(2);
    expect(screen.getByText(/Contato não informado/)).toBeTruthy();
    expect(screen.getByText(/85 99999-0000/)).toBeTruthy();
    expect(screen.getByText(/Sala J-201 · Chave Primária/)).toBeTruthy();
    expect(screen.getAllByText(/Prazo: 05\/10\/2026 às 18:00/)).toHaveLength(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain(
      "/alertas?status=open",
    );
  });

  it("não oferece ações sem back-end", async () => {
    fetchMock.mockImplementation(async () => response([keyAlert]));
    render(<OverdueAlertsApi onRegisterReturn={() => undefined} />);
    await screen.findByText("Chave J-201 · Primária");

    expect(screen.queryByText(/lembrete/i)).toBeNull();
    expect(screen.queryByText(/Exportar termo/)).toBeNull();
    expect(screen.queryByText(/Leitor de código/)).toBeNull();
    expect(screen.queryByText(/Demonstração/i)).toBeNull();
  });

  it("registrar devolução leva à tela de devolução; resolvido não oferece a ação", async () => {
    const onRegisterReturn = vi.fn();
    fetchMock.mockResolvedValueOnce(response([keyAlert]));
    render(<OverdueAlertsApi onRegisterReturn={onRegisterReturn} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Registrar devolução" }),
    );
    expect(onRegisterReturn).toHaveBeenCalledTimes(1);

    fetchMock.mockResolvedValueOnce(
      response([
        {
          ...keyAlert,
          status: "resolved",
          resolvedAt: "2026-10-06T08:00:00-03:00",
        },
      ]),
    );
    fireEvent.change(screen.getByLabelText("Situação"), {
      target: { value: "resolved" },
    });
    expect(await screen.findByText("Resolvido")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Registrar devolução" }),
    ).toBeNull();
    expect(String(fetchMock.mock.calls[1][0])).toContain("status=resolved");
  });

  it("filtra por tipo e pesquisa no que veio do servidor", async () => {
    fetchMock.mockImplementation(async () =>
      response([keyAlert, materialAlert]),
    );
    render(<OverdueAlertsApi onRegisterReturn={() => undefined} />);
    await screen.findByText("Projetor Epson WXGA");

    fireEvent.change(screen.getByLabelText("Tipo"), {
      target: { value: "key" },
    });
    expect(screen.queryByText("Projetor Epson WXGA")).toBeNull();

    fireEvent.change(screen.getByLabelText("Tipo"), {
      target: { value: "all" },
    });
    fireEvent.change(screen.getByLabelText("Pesquisar"), {
      target: { value: "projetor" },
    });
    expect(screen.queryByText("Chave J-201 · Primária")).toBeNull();
    expect(screen.getByText("Projetor Epson WXGA")).toBeTruthy();
  });

  it("mostra o erro do servidor e permite tentar de novo", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ message: "Sem permissão." }, 403),
    );
    fetchMock.mockResolvedValueOnce(response([]));
    render(<OverdueAlertsApi onRegisterReturn={() => undefined} />);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Sem permissão.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() =>
      expect(screen.getByText("Nenhum alerta encontrado.")).toBeTruthy(),
    );
  });
});

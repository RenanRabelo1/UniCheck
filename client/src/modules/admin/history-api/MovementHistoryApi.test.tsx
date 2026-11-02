// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MovementHistoryApi } from "./MovementHistoryApi";

const returned = {
  itemId: "1007",
  requestId: "1004",
  protocol: "CCT-2026-01004",
  requester: "Prof. Ricardo Mendes",
  registration: "2048819",
  itemName: "Kit Arduino",
  itemType: "material",
  room: "J-311",
  status: "DEVOLVIDO",
  statusLabel: "Devolvido",
  decision: {
    at: "2026-10-02T12:00:00-03:00",
    by: "Coordenação CCT",
    outcome: "approved",
    reason: null,
  },
  withdrawal: {
    at: "2026-10-02T13:05:00-03:00",
    by: "Ana Secretaria",
    responsible: "Prof. Ricardo Mendes",
    notes: null,
  },
  return: {
    at: "2026-10-02T17:45:00-03:00",
    by: "João Secretaria",
    responsible: "Prof. Ricardo Mendes",
    notes: "Condição: Íntegro",
  },
  wasLate: true,
};
const pending = {
  ...returned,
  itemId: "1003",
  itemName: "Notebook",
  status: "PENDENTE",
  statusLabel: "Pendente",
  decision: null,
  withdrawal: null,
  return: null,
  wasLate: false,
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
  fetchMock.mockImplementation(async () => response([returned, pending]));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Tela 16 conectada", () => {
  it("lista um registro por item, com situação final e atraso", async () => {
    render(<MovementHistoryApi />);

    const row = (await screen.findByText("Kit Arduino")).closest("tr")!;
    expect(within(row).getByText("Devolvido")).toBeTruthy();
    expect(within(row).getByText(/CCT-2026-01004/)).toBeTruthy();
    expect(within(row).getByText(/2048819/)).toBeTruthy();
    expect(within(row).getByText("Teve atraso")).toBeTruthy();
    expect(screen.getByText("Notebook")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("abre os detalhes com os responsáveis por decisão, retirada e devolução", async () => {
    render(<MovementHistoryApi />);
    const row = (await screen.findByText("Kit Arduino")).closest("tr")!;
    fireEvent.click(within(row).getByRole("button", { name: "Ver detalhes" }));

    const details = screen.getByRole("complementary");
    expect(within(details).getByText(/Coordenação CCT/)).toBeTruthy();
    expect(within(details).getByText(/Ana Secretaria/)).toBeTruthy();
    expect(within(details).getByText(/João Secretaria/)).toBeTruthy();
    expect(within(details).getByText(/Condição: Íntegro/)).toBeTruthy();
  });

  it("mostra quando uma etapa ainda não aconteceu", async () => {
    render(<MovementHistoryApi />);
    const row = (await screen.findByText("Notebook")).closest("tr")!;
    fireEvent.click(within(row).getByRole("button", { name: "Ver detalhes" }));

    const details = screen.getByRole("complementary");
    expect(within(details).getAllByText("Não registrada")).toHaveLength(3);
  });

  it("aplica os filtros na consulta ao servidor e limpa depois", async () => {
    render(<MovementHistoryApi />);
    await screen.findByText("Kit Arduino");

    fireEvent.change(screen.getByLabelText("Buscar"), {
      target: { value: "lucas" },
    });
    fireEvent.change(screen.getByLabelText("Material"), {
      target: { value: "arduino" },
    });
    fireEvent.change(screen.getByLabelText("Sala"), {
      target: { value: "J-311" },
    });
    fireEvent.change(screen.getByLabelText("Situação"), {
      target: { value: "DEVOLVIDO" },
    });
    fireEvent.change(screen.getByLabelText("De"), {
      target: { value: "2026-10-01" },
    });
    fireEvent.change(screen.getByLabelText("Até"), {
      target: { value: "2026-10-05" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const url = new URL(String(fetchMock.mock.calls[1][0]));
    expect(Object.fromEntries(url.searchParams)).toEqual({
      search: "lucas",
      material: "arduino",
      room: "J-311",
      status: "DEVOLVIDO",
      from: "2026-10-01",
      to: "2026-10-05",
    });

    await screen.findByText("Kit Arduino");
    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(String(fetchMock.mock.calls[2][0])).toMatch(/historico$/);
  });

  it("não oferece imprimir, exportar nem texto demonstrativo", async () => {
    render(<MovementHistoryApi />);
    await screen.findByText("Kit Arduino");
    expect(screen.queryByRole("button", { name: "Imprimir" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Exportar" })).toBeNull();
    expect(screen.queryByText(/demonstrativ/i)).toBeNull();
  });

  it("mostra o erro de filtro inválido devolvido pelo servidor", async () => {
    fetchMock.mockImplementation(async () =>
      response({ message: "A data inicial não pode ser posterior." }, 400),
    );
    render(<MovementHistoryApi />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "não pode ser posterior",
    );
  });
});

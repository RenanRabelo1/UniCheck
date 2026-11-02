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
import { AdminDashboardApi } from "./AdminDashboardApi";

const session = {
  name: "Coordenação CCT",
  registration: "18024900",
  role: "coordinator" as const,
  roleLabel: "Coordenador CCT",
};
const dashboard = {
  summary: {
    pendingItems: 21,
    approvedItems: 32,
    withdrawnItems: 43,
    pendingReturns: 54,
    openAlerts: 65,
  },
  recentRequests: [
    {
      id: "1001",
      protocol: "CCT-2026-01001",
      requester: "Prof. Ricardo Mendes",
      requesterRole: "Professor",
      items: ["Notebook", "Cabo HDMI"],
      date: "2026-10-06",
      pickupTime: "08:00",
      returnTime: "12:00",
      statusLabel: "Em atraso",
    },
  ],
};
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const fetchMock = vi.fn();
const props = () => ({
  session,
  onLogout: vi.fn(),
  onAction: vi.fn(),
  onViewRequest: vi.fn(),
});

beforeEach(() => {
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.stubEnv("VITE_API_URL", "http://localhost:3000");
  sessionStorage.setItem("unicheck_token", "token-teste");
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => response(dashboard));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Tela 7 conectada", () => {
  it("mostra os indicadores vindos do servidor, inclusive alertas", async () => {
    render(<AdminDashboardApi {...props()} />);
    const metrics = await screen.findByRole("region", {
      name: "Resumo operacional",
    });

    await waitFor(() => expect(within(metrics).getByText("21")).toBeTruthy());
    for (const value of ["32", "43", "54", "65"]) {
      expect(within(metrics).getByText(value)).toBeTruthy();
    }
    expect(String(fetchMock.mock.calls[0][0])).toContain("/dashboard/admin");
  });

  it("não exibe número fixo, leitor, ocupação nem aviso de demonstração", async () => {
    render(<AdminDashboardApi {...props()} />);
    await screen.findByText("CCT-2026-01001");

    expect(screen.queryByText(/Ocupação do Bloco/)).toBeNull();
    expect(screen.queryByText("72%")).toBeNull();
    expect(screen.queryByText(/Guichê/)).toBeNull();
    expect(screen.queryByRole("search")).toBeNull();
    expect(screen.queryByText(/demonstra/i)).toBeNull();
    expect(screen.queryByText(/24 de setembro/)).toBeNull();
    expect(screen.queryByText("Ana Silva")).toBeNull();
    expect(screen.queryByText(/Exportar/)).toBeNull();
  });

  it("abre a solicitação real pelo id", async () => {
    const handlers = props();
    render(<AdminDashboardApi {...handlers} />);
    await screen.findByText("Prof. Ricardo Mendes");

    expect(screen.getByText("Notebook, Cabo HDMI")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Detalhes/ }));
    expect(handlers.onViewRequest).toHaveBeenCalledWith("1001");
  });

  it("o menu leva a alertas e a salas e chaves (RF12.11, RF12.13)", async () => {
    const handlers = props();
    render(<AdminDashboardApi {...handlers} />);
    await screen.findByText("CCT-2026-01001");
    const nav = screen.getByRole("navigation", {
      name: "Navegação administrativa",
    });

    fireEvent.click(within(nav).getByRole("button", { name: /Alertas/ }));
    expect(handlers.onAction).toHaveBeenCalledWith("alerts");
    fireEvent.click(
      within(nav).getByRole("button", { name: "Salas e chaves" }),
    );
    expect(handlers.onAction).toHaveBeenCalledWith("rooms-keys");
  });

  it("atualizar recarrega do servidor, sem sair do painel", async () => {
    const handlers = props();
    render(<AdminDashboardApi {...handlers} />);
    await screen.findByText("CCT-2026-01001");

    fireEvent.click(screen.getByRole("button", { name: "Atualizar dados" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(handlers.onAction).not.toHaveBeenCalled();
  });

  it("em erro mostra a mensagem, sem zeros que pareçam reais", async () => {
    fetchMock.mockImplementation(async () =>
      response({ message: "Sem permissão." }, 403),
    );
    render(<AdminDashboardApi {...props()} />);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Sem permissão.",
    );
    expect(
      screen.queryByRole("region", { name: "Resumo operacional" }),
    ).toBeNull();
  });
});

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MyRequestsScreen } from "../../components/MyRequestsScreen";
import { RequestDetailsLoader } from "./RequestDetailsLoader";
import { getRequestDetails } from "../../services/requests";
import { loginApi } from "../../services/auth";
const session = {
  name: "Pessoa Teste",
  registration: "123",
  role: "professor" as const,
  roleLabel: "Professor",
};
const item = {
  id: "i",
  name: "Material real",
  detail: null,
  quantity: 2,
  status: "RECUSADO",
  statusLabel: "Recusado",
  updatedAt: "2026-10-02T12:00:00Z",
  refusalReason: "Sem estoque",
};
const dto = {
  id: "real-1",
  protocol: "real-1",
  semester: "2026.2",
  createdAt: "2026-10-01T12:00:00Z",
  date: "2026-10-02",
  room: { value: "r", label: "Sala real" },
  pickupTime: "09:00",
  returnTime: "12:00",
  notes: null,
  items: [item],
};
function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
beforeEach(() => {
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.stubEnv("VITE_API_URL", "http://localhost:3000");
  sessionStorage.setItem("unicheck_token", "test-token");
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  sessionStorage.clear();
});
function renderList() {
  return render(
    <MyRequestsScreen
      session={session}
      onBack={vi.fn()}
      onNewRequest={vi.fn()}
      onOpenRequest={vi.fn()}
    />,
  );
}
describe("telas com API", () => {
  it("busca pedidos com token, exibe dados reais e filtra busca/status/semestre", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([dto]));
    vi.stubGlobal("fetch", fetchMock);
    renderList();
    expect(screen.getByRole("status").textContent).toContain("Carregando");
    await screen.findByRole("heading", { name: "Minhas solicitações" });
    expect(screen.getAllByText("#real-1").length).toBeGreaterThan(0);
    expect(screen.queryByText("#CCT-2026-0148")).toBeNull();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer test-token",
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "2026.2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Recusadas/ }));
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "inexistente" },
    });
    expect(screen.getByRole("status").textContent).toContain(
      "Nenhuma solicitação",
    );
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(screen.getAllByText("#real-1").length).toBeGreaterThan(0);
  });
  it("exibe erro sem mocks e permite tentar novamente com lista vazia", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(response({ message: "Falha de teste" }, 500))
        .mockResolvedValueOnce(response([])),
    );
    renderList();
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Falha de teste",
    );
    expect(screen.queryByText("#CCT-2026-0148")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByText(
        "Você ainda não possui solicitações registradas.",
      ),
    ).toBeTruthy();
  });
  it("carrega o ID selecionado e mostra motivo de recusa", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        response({ ...dto, requester: session, movements: [] }),
      );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <RequestDetailsLoader
        session={session}
        selectedRequest={{
          id: "real-1",
          protocol: "real-1",
          requestedAt: "",
          period: "2026.2",
          item: "",
          destination: "",
          schedule: "",
          status: "rejected",
          instruction: "",
        }}
        onBack={vi.fn()}
      />,
    );
    expect((await screen.findAllByText("Sem estoque")).length).toBeGreaterThan(
      0,
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:3000/solicitacoes/real-1",
    );
  });
  it("mantém status diferentes e horários reais sem inventar aprovação antiga", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response({
            ...dto,
            requester: session,
            items: [
              item,
              {
                ...item,
                id: "i2",
                status: "DEVOLVIDO",
                statusLabel: "Devolvido",
                refusalReason: null,
              },
            ],
            movements: [
              {
                id: "m",
                itemId: "i2",
                itemName: "Material real",
                type: "DEVOLUCAO",
                registeredAt: "2026-10-02T14:45:00-03:00",
                responsible: "Pessoa Teste",
                attendant: "Atendente",
                notes: null,
              },
            ],
          }),
        ),
    );
    const detail = await getRequestDetails("real-1");
    expect(detail.items.map((i) => i.status)).toEqual([
      "RECUSADO",
      "DEVOLVIDO",
    ]);
    expect(detail.items[1].return?.date).toContain("14:45");
    expect(detail.items[1].pickup).toBeUndefined();
    expect(detail.timeline.some((t) => t.title.includes("Aprovado"))).toBe(
      false,
    );
  });
  it("autentica na API e guarda o token recebido, recusando senha inválida", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(response({ token: "real-token", user: session }))
        .mockResolvedValueOnce(
          response({ message: "Credenciais inválidas." }, 401),
        ),
    );
    expect(
      (await loginApi("123", "password", "professor")).dashboard.name,
    ).toBe(session.name);
    expect(sessionStorage.getItem("unicheck_token")).toBe("real-token");
    await expect(loginApi("123", "wrong", "professor")).rejects.toThrow(
      "Credenciais inválidas.",
    );
    expect(sessionStorage.getItem("unicheck_token")).toBeNull();
  });
});

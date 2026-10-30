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
import { PendingRequestsApi } from "./PendingRequestsApi";
import { RequestAnalysisApi } from "./RequestAnalysisApi";
import type { AdminRequest } from "../../../services/adminRequests";
import App from "../../../App";
import { AdminWorkspace } from "../../../app/AdminWorkspace";

const request: AdminRequest = {
  id: "42",
  protocol: "CCT-2026-00042",
  semester: "2026.2",
  createdAt: "2026-10-29T09:00:00-03:00",
  date: "2026-11-02",
  room: { value: "1", label: "J-201" },
  pickupTime: "09:00",
  returnTime: "11:00",
  notes: "Aula prática",
  requester: {
    name: "Professora Ana",
    registration: "123",
    roleLabel: "Professor",
  },
  items: [
    {
      id: "7",
      type: "material",
      name: "Projetor",
      detail: null,
      quantity: 1,
      status: "PENDENTE",
      statusLabel: "Pendente",
      updatedAt: "2026-10-29T09:00:00-03:00",
      refusalReason: null,
    },
    {
      id: "8",
      type: "material",
      name: "Notebook",
      detail: "Portátil",
      quantity: 2,
      status: "PENDENTE",
      statusLabel: "Pendente",
      updatedAt: "2026-10-29T09:00:00-03:00",
      refusalReason: null,
    },
  ],
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

describe("Pendências pela API", () => {
  it("busca com autenticação, filtra pedidos e abre o ID selecionado", async () => {
    fetchMock.mockResolvedValueOnce(response([request]));
    const select = vi.fn();
    render(<PendingRequestsApi onAnalyzeRequest={select} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Analisar CCT-2026-00042" }),
    );
    expect(select).toHaveBeenCalledWith("42");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/admin/solicitacoes?status=PENDENTE",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-teste",
        }),
      }),
    );
    fireEvent.change(screen.getByLabelText("Recurso pendente"), {
      target: { value: "key" },
    });
    expect(
      screen.getByText("Nenhuma solicitação encontrada com esses filtros"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    fireEvent.change(screen.getByLabelText("Buscar solicitação"), {
      target: { value: "  ANA " },
    });
    expect(
      screen.getByRole("button", { name: "Analisar CCT-2026-00042" }),
    ).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Data de utilização"), {
      target: { value: "2026-11-03" },
    });
    expect(
      screen.queryByRole("button", { name: "Analisar CCT-2026-00042" }),
    ).toBeNull();
  });
  it("permite tentar novamente após falha e mostra fila vazia", async () => {
    fetchMock
      .mockResolvedValueOnce(
        response({ message: "Servidor indisponível" }, 503),
      )
      .mockResolvedValueOnce(response([]));
    render(<PendingRequestsApi onAnalyzeRequest={vi.fn()} />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Servidor indisponível",
    );
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByText("Não há solicitações pendentes"),
    ).toBeTruthy();
  });
  it("mostra erro de sessão sem substituir os pedidos por exemplos", async () => {
    sessionStorage.clear();
    render(<PendingRequestsApi onAnalyzeRequest={vi.fn()} />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Entre novamente",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("Análise e gravação por item", () => {
  it("não busca pedido de exemplo quando nenhum foi selecionado", () => {
    render(<RequestAnalysisApi requestId={null} onBackToPending={vi.fn()} />);
    expect(
      screen.getByText("Selecione um pedido na lista de pendências."),
    ).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("salva aprovação, bloqueia envio duplo e mantém o outro item pendente", async () => {
    let resolveSave!: (value: Response) => void;
    fetchMock.mockResolvedValueOnce(response(request)).mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveSave = resolve;
        }),
    );
    render(<RequestAnalysisApi requestId="42" onBackToPending={vi.fn()} />);
    const item = within(
      await screen.findByRole("article", { name: "Projetor" }),
    );
    const approve = item.getByRole("button", { name: "Aprovar e salvar" });
    fireEvent.click(approve);
    fireEvent.click(approve);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:3000/admin/solicitacoes/42/itens/7/decisao",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ decision: "approve" }),
      }),
    );
    resolveSave(
      response({
        ...request,
        items: [
          { ...request.items[0], status: "APROVADO", statusLabel: "Aprovado" },
          request.items[1],
        ],
      }),
    );
    expect(
      await screen.findByText("Parecer do item salvo com sucesso."),
    ).toBeTruthy();
    expect(item.getByText("Aprovado")).toBeTruthy();
    expect(item.queryByRole("button", { name: "Aprovar e salvar" })).toBeNull();
    expect(screen.getByText("1 item(ns) ainda aguardam análise.")).toBeTruthy();
  });
  it("exige motivo, envia recusa e recupera o parecer ao reabrir o pedido", async () => {
    const refused = {
      ...request,
      items: [
        {
          ...request.items[0],
          status: "RECUSADO",
          statusLabel: "Recusado",
          refusalReason: "Em manutenção",
        },
        request.items[1],
      ],
    };
    fetchMock
      .mockResolvedValueOnce(response(request))
      .mockResolvedValueOnce(response(refused))
      .mockResolvedValueOnce(response(refused));
    const first = render(
      <RequestAnalysisApi requestId="42" onBackToPending={vi.fn()} />,
    );
    const item = within(
      await screen.findByRole("article", { name: "Projetor" }),
    );
    fireEvent.click(item.getByRole("button", { name: "Recusar" }));
    const confirm = item.getByRole("button", {
      name: "Confirmar recusa",
    }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.change(item.getByRole("textbox"), { target: { value: "   " } });
    expect(confirm.disabled).toBe(true);
    fireEvent.change(item.getByRole("textbox"), {
      target: { value: " Em manutenção " },
    });
    fireEvent.click(confirm);
    expect(
      await screen.findByText("Motivo da recusa: Em manutenção"),
    ).toBeTruthy();
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("/itens/7/decisao"),
      expect.objectContaining({
        body: JSON.stringify({ decision: "refuse", reason: "Em manutenção" }),
      }),
    );
    first.unmount();
    render(<RequestAnalysisApi requestId="42" onBackToPending={vi.fn()} />);
    expect(
      await screen.findByText("Motivo da recusa: Em manutenção"),
    ).toBeTruthy();
  });
  it("não anuncia sucesso em conflito e exige releitura antes de outro envio", async () => {
    fetchMock
      .mockResolvedValueOnce(response(request))
      .mockResolvedValueOnce(
        response({ message: "Este item já foi analisado." }, 409),
      )
      .mockResolvedValueOnce(
        response({
          ...request,
          items: request.items.map((item) => ({
            ...item,
            status: "APROVADO",
            statusLabel: "Aprovado",
          })),
        }),
      );
    render(<RequestAnalysisApi requestId="42" onBackToPending={vi.fn()} />);
    fireEvent.click(
      (await screen.findAllByRole("button", { name: "Aprovar e salvar" }))[0],
    );
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Este item já foi analisado.",
    );
    expect(screen.queryByText("Parecer do item salvo com sucesso.")).toBeNull();
    expect(
      (
        screen.getAllByRole("button", {
          name: "Aprovar e salvar",
        })[0] as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    fireEvent.click(
      screen.getByRole("button", { name: "Atualizar para conferir" }),
    );
    expect(
      await screen.findByText("Todos os itens foram analisados."),
    ).toBeTruthy();
  });
  it("exibe pedido inexistente e não oferece decisões", async () => {
    fetchMock.mockResolvedValueOnce(
      response({ message: "Solicitação não encontrada." }, 404),
    );
    render(<RequestAnalysisApi requestId="999" onBackToPending={vi.fn()} />);
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Solicitação não encontrada.",
    );
    expect(
      screen.queryByRole("button", { name: "Aprovar e salvar" }),
    ).toBeNull();
  });
  it("descarta uma resposta atrasada ao trocar a seleção", async () => {
    let resolveFirst!: (value: Response) => void;
    fetchMock
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(
        response({ ...request, id: "99", protocol: "CCT-2026-00099" }),
      );
    const view = render(
      <RequestAnalysisApi requestId="42" onBackToPending={vi.fn()} />,
    );
    view.rerender(
      <RequestAnalysisApi requestId="99" onBackToPending={vi.fn()} />,
    );
    expect(await screen.findByText("Solicitação CCT-2026-00099")).toBeTruthy();
    resolveFirst(response(request));
    await waitFor(() =>
      expect(screen.queryByText("Solicitação CCT-2026-00042")).toBeNull(),
    );
  });
});

it("identifica como reais apenas os módulos administrativos integrados", () => {
  const props = {
    onBackToDashboard: vi.fn(),
    onSelectView: vi.fn(),
    children: <p>Conteúdo</p>,
  };
  const view = render(<AdminWorkspace {...props} activeView="admin-pending" />);
  expect(
    screen.getByText("Pedidos reais · Os pareceres são salvos no sistema."),
  ).toBeTruthy();
  view.rerender(<AdminWorkspace {...props} activeView="admin-checkout" />);
  expect(screen.getByText(/Dados locais/)).toBeTruthy();
  vi.stubEnv("VITE_DATA_SOURCE", "mock");
  view.rerender(<AdminWorkspace {...props} activeView="admin-pending" />);
  expect(screen.getByText(/Dados locais/)).toBeTruthy();
});

it("integra login da coordenação, fila, seleção e retorno à fila atualizada", async () => {
  fetchMock
    .mockResolvedValueOnce(
      response({
        token: "coordenador-token",
        user: {
          name: "Coordenação",
          registration: "18024900",
          role: "coordinator",
          roleLabel: "Coordenador CCT",
        },
      }),
    )
    .mockResolvedValueOnce(response([request]))
    .mockResolvedValueOnce(response(request))
    .mockResolvedValueOnce(response([]));
  render(<App />);
  fireEvent.click(screen.getByRole("tab", { name: "Coordenador CCT" }));
  fireEvent.change(screen.getByLabelText("E-mail institucional ou matrícula"), {
    target: { value: "18024900" },
  });
  fireEvent.change(screen.getByLabelText(/Senha/), {
    target: { value: "unicheck123" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Acessar/ }));
  fireEvent.click(await screen.findByRole("button", { name: "Solicitações" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Analisar CCT-2026-00042" }),
  );
  expect(await screen.findByText("Solicitação CCT-2026-00042")).toBeTruthy();
  expect(screen.getByText("Professora Ana")).toBeTruthy();
  fireEvent.click(
    screen.getByRole("button", { name: "Voltar à lista de pendências" }),
  );
  expect(await screen.findByText("Não há solicitações pendentes")).toBeTruthy();
});

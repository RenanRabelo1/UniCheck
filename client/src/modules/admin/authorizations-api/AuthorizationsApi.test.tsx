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
import { AuthorizationsApi } from "./AuthorizationsApi";

const professor = { id: "1", name: "Prof. Ricardo", active: true };
const project = {
  id: "10",
  name: "Laboratório de Redes",
  description: null,
  professor,
  active: true,
};
const authorization = {
  id: "100",
  student: {
    id: "2",
    name: "Lucas Almeida",
    email: "lucas@unifor.br",
    registration: "2412001",
  },
  project: { id: "10", name: "Laboratório de Redes", active: true },
  professor,
  coordinator: "Coordenação CCT",
  authorizedAt: "2026-09-01",
  inactivatedAt: null,
  active: true,
  canRequestKey: true,
};
const options = {
  students: [
    {
      id: "2",
      name: "Lucas Almeida",
      registration: "2412001",
      email: "lucas@unifor.br",
    },
    {
      id: "3",
      name: "Bia Lima",
      registration: "2412002",
      email: "bia@unifor.br",
    },
  ],
  professors: [{ id: "1", name: "Prof. Ricardo", registration: "2048819" }],
};
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const fetchMock = vi.fn();
let authorizations: unknown[];
let write: (() => Response) | undefined;
const sent = (method: string, path: string) => {
  const call = fetchMock.mock.calls.find(
    ([url, init]) => init?.method === method && String(url).endsWith(path),
  );
  return call && JSON.parse(call[1].body);
};

beforeEach(() => {
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.stubEnv("VITE_API_URL", "http://localhost:3000");
  sessionStorage.setItem("unicheck_token", "token-teste");
  authorizations = [authorization];
  write = undefined;
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    if (init.method) return write?.();
    if (url.endsWith("/admin/projetos")) return response([project]);
    if (url.endsWith("/opcoes")) return response(options);
    return response(authorizations);
  });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Tela 15 conectada", () => {
  it("mostra aluno, e-mail, projeto, professor, coordenador e data da autorização", async () => {
    render(<AuthorizationsApi />);
    const row = (await screen.findByText("Lucas Almeida")).closest("tr")!;

    expect(within(row).getByText(/lucas@unifor.br/)).toBeTruthy();
    expect(within(row).getByText(/2412001/)).toBeTruthy();
    expect(within(row).getByText("Laboratório de Redes")).toBeTruthy();
    expect(within(row).getByText("Prof. Ricardo")).toBeTruthy();
    expect(within(row).getByText(/Coordenação CCT/)).toBeTruthy();
    expect(within(row).getByText(/01\/09\/2026/)).toBeTruthy();
    expect(within(row).getByText("Pode solicitar chave")).toBeTruthy();
  });

  it("escolhe aluno e projeto em listas reais, sem texto livre nem código", async () => {
    write = () => response(authorization, 201);
    render(<AuthorizationsApi />);
    await screen.findByText("Lucas Almeida");

    expect(screen.queryByLabelText("Código")).toBeNull();
    expect(screen.queryByLabelText("Matrícula")).toBeNull();
    fireEvent.change(screen.getByLabelText("Aluno"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("Projeto"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Autorizar aluno" }));

    await waitFor(() =>
      expect(sent("POST", "/admin/autorizacoes")).toEqual({
        studentId: "3",
        projectId: "10",
      }),
    );
  });

  it("cadastra projeto com o professor escolhido", async () => {
    write = () => response(project, 201);
    render(<AuthorizationsApi />);
    await screen.findByText("Lucas Almeida");

    fireEvent.change(screen.getByLabelText("Nome do projeto"), {
      target: { value: "Robótica" },
    });
    fireEvent.change(screen.getByLabelText("Professor responsável"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar projeto" }));

    await waitFor(() =>
      expect(sent("POST", "/admin/projetos")).toEqual({
        name: "Robótica",
        professorId: "1",
      }),
    );
  });

  it("inativa a autorização e explica o bloqueio", async () => {
    authorizations = [{ ...authorization, canRequestKey: false }];
    write = () => response({ ...authorization, active: false });
    render(<AuthorizationsApi />);
    const row = (await screen.findByText("Lucas Almeida")).closest("tr")!;

    expect(within(row).getByText("Bloqueada")).toBeTruthy();
    fireEvent.click(within(row).getByRole("button", { name: "Inativar" }));
    await waitFor(() =>
      expect(sent("PATCH", "/admin/autorizacoes/100")).toEqual({
        active: false,
      }),
    );
  });

  it("inativa projeto pelo cadastro e mostra a recusa do servidor", async () => {
    write = () => response({ message: "Projeto não encontrado." }, 404);
    render(<AuthorizationsApi />);
    await screen.findByText("Lucas Almeida");

    const list = screen.getByLabelText("Projetos cadastrados");
    fireEvent.click(within(list).getByRole("button", { name: "Inativar" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Projeto não encontrado.",
    );
  });

  it("filtra por aluno e estado sem nova consulta", async () => {
    authorizations = [
      authorization,
      {
        ...authorization,
        id: "101",
        student: {
          id: "3",
          name: "Bia Lima",
          email: "bia@unifor.br",
          registration: "2412002",
        },
        active: false,
        canRequestKey: false,
      },
    ];
    render(<AuthorizationsApi />);
    await screen.findByText("Bia Lima");
    const calls = fetchMock.mock.calls.length;

    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: "inactive" },
    });
    expect(screen.queryByText("Lucas Almeida")).toBeNull();
    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: "all" },
    });
    fireEvent.change(screen.getByLabelText("Buscar aluno ou matrícula"), {
      target: { value: "lucas" },
    });
    expect(screen.queryByText("Bia Lima")).toBeNull();
    expect(fetchMock.mock.calls.length).toBe(calls);
  });

  it("não fala em demonstração", async () => {
    render(<AuthorizationsApi />);
    await screen.findByText("Lucas Almeida");
    expect(screen.queryByText(/demonstra/i)).toBeNull();
  });
});

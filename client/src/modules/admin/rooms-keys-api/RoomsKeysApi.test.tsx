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
import { RoomsKeysApi } from "./RoomsKeysApi";

const rooms = [
  { id: "1", code: "J-201", name: "Laboratório de Redes", active: true },
  { id: "2", code: "J-311", name: "Sala de Projetos", active: false },
];
const key = (id: string, roomId: string, patch = {}) => ({
  id,
  room: { value: roomId, label: `Sala ${roomId}` },
  type: "primary",
  typeLabel: "Primária",
  active: true,
  inPossession: false,
  ...patch,
});
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const fetchMock = vi.fn();
let keys: unknown[];

function routeFetch(extra?: (url: string, init: RequestInit) => unknown) {
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    const handled = extra?.(url, init);
    if (handled) return handled;
    if (url.endsWith("/admin/salas")) return response(rooms);
    if (url.endsWith("/admin/chaves")) return response(keys);
    throw new Error(`rota inesperada: ${url}`);
  });
}

beforeEach(() => {
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.stubEnv("VITE_API_URL", "http://localhost:3000");
  sessionStorage.setItem("unicheck_token", "token-teste");
  keys = [
    key("10", "1", { inPossession: true }),
    key("11", "1", { type: "secondary", typeLabel: "Secundária" }),
    key("12", "2", { active: false }),
  ];
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Tela 14 conectada", () => {
  it("mostra a situação real de cada chave e nada de simulação", async () => {
    routeFetch();
    render(<RoomsKeysApi />);

    const list = await screen.findByRole("list", {
      name: "Chaves de Laboratório de Redes",
    });
    expect(within(list).getByText("Em posse")).toBeTruthy();
    expect(within(list).getByText("Disponível")).toBeTruthy();
    expect(screen.queryByText(/Simular/)).toBeNull();
    expect(screen.queryByText(/demonstra/i)).toBeNull();
    expect(screen.queryByLabelText("Localização")).toBeNull();
  });

  it("cadastra sala, mandando código e nome ao servidor", async () => {
    routeFetch((url, init) =>
      url.endsWith("/admin/salas") && init.method === "POST"
        ? response({ id: "3", code: "J-205", name: "IoT", active: true }, 201)
        : undefined,
    );
    render(<RoomsKeysApi />);
    await screen.findByRole("button", { name: /J-201/ });

    fireEvent.change(screen.getByLabelText("Código da sala"), {
      target: { value: "J-205" },
    });
    fireEvent.change(screen.getByLabelText("Nome da sala"), {
      target: { value: "IoT" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar sala" }));

    expect(await screen.findByText("Sala J-205 cadastrada.")).toBeTruthy();
    const post = fetchMock.mock.calls.find(
      ([, init]) => init?.method === "POST",
    );
    expect(JSON.parse(post?.[1].body)).toEqual({ code: "J-205", name: "IoT" });
  });

  it("oferece só o tipo de chave que falta na sala", async () => {
    routeFetch();
    render(<RoomsKeysApi />);
    await screen.findByRole("button", { name: /J-201/ });

    expect(
      screen.queryByRole("button", { name: "Cadastrar chave" }),
    ).toBeNull();
    expect(screen.getByText(/já tem chave primária e secundária/)).toBeTruthy();
  });

  it("cadastra a chave que falta na sala selecionada", async () => {
    keys = [key("10", "1")];
    routeFetch((url, init) =>
      url.endsWith("/admin/chaves") && init.method === "POST"
        ? response(key("13", "1", { type: "secondary" }), 201)
        : undefined,
    );
    render(<RoomsKeysApi />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Cadastrar chave" }),
    );
    await waitFor(() => {
      const post = fetchMock.mock.calls.find(
        ([, init]) => init?.method === "POST",
      );
      expect(JSON.parse(post?.[1].body)).toEqual({
        roomId: "1",
        type: "secondary",
      });
    });
  });

  it("inativa chave e mostra a recusa do servidor", async () => {
    routeFetch((url, init) =>
      url.endsWith("/admin/chaves/10") && init.method === "PATCH"
        ? response({ message: "Esta chave está aprovada ou em posse." }, 409)
        : undefined,
    );
    render(<RoomsKeysApi />);
    const buttons = await screen.findAllByRole("button", {
      name: "Inativar chave",
    });
    fireEvent.click(buttons[0]);

    expect((await screen.findByRole("alert")).textContent).toContain(
      "aprovada ou em posse",
    );
  });

  it("reativa sala inativa pelo próprio cadastro", async () => {
    routeFetch((url, init) =>
      url.endsWith("/admin/salas/2") && init.method === "PATCH"
        ? response({ ...rooms[1], active: true })
        : undefined,
    );
    render(<RoomsKeysApi />);

    fireEvent.click(await screen.findByRole("button", { name: /J-311/ }));
    fireEvent.click(screen.getByRole("button", { name: "Reativar sala" }));

    await waitFor(() => {
      const patch = fetchMock.mock.calls.find(
        ([, init]) => init?.method === "PATCH",
      );
      expect(JSON.parse(patch?.[1].body)).toEqual({ active: true });
    });
  });
});

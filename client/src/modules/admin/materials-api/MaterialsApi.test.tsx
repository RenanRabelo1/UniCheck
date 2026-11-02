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
import { MaterialsApi } from "./MaterialsApi";

const projector = {
  id: "1",
  name: "Projetor Epson",
  category: "Projetor",
  control: "individual",
  patrimony: "PAT-1",
  detail: null,
  totalQuantity: 1,
  committed: 1,
  inPossession: 1,
  active: true,
};
const cable = {
  id: "2",
  name: "Cabo HDMI",
  category: "Cabos",
  control: "quantity",
  patrimony: null,
  detail: "Armário 2",
  totalQuantity: 8,
  committed: 3,
  inPossession: 2,
  active: true,
};
const oldPen = { ...cable, id: "3", name: "Pincel antigo", active: false };
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const fetchMock = vi.fn();
const sent = (method: string) => {
  const call = fetchMock.mock.calls.find(([, init]) => init?.method === method);
  return { url: String(call?.[0]), body: JSON.parse(call?.[1].body ?? "null") };
};

function routeFetch(write?: () => Response) {
  fetchMock.mockImplementation(async (_url: string, init: RequestInit) =>
    init.method ? write?.() : response([projector, cable, oldPen]),
  );
}

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

describe("Tela 13 conectada", () => {
  it("mostra categoria, controle e disponibilidade reais, só dos ativos por padrão", async () => {
    routeFetch();
    render(<MaterialsApi />);

    const row = (await screen.findByText("Projetor Epson")).closest("tr")!;
    expect(within(row).getByText("Projetor")).toBeTruthy();
    expect(within(row).getByText("Individual")).toBeTruthy();
    expect(within(row).getByText("Retirado")).toBeTruthy();
    expect(within(row).getByText(/PAT-1/)).toBeTruthy();

    const cableRow = screen.getByText("Cabo HDMI").closest("tr")!;
    expect(within(cableRow).getByText("6 de 8 disponíveis agora")).toBeTruthy();
    expect(screen.queryByText("Pincel antigo")).toBeNull();

    fireEvent.change(screen.getByLabelText("Situação"), {
      target: { value: "inactive" },
    });
    expect(screen.getByText("Pincel antigo")).toBeTruthy();
  });

  it("cadastra material individual com patrimônio, sem localização nem descrição", async () => {
    routeFetch(() => response({ ...projector, id: "9" }, 201));
    render(<MaterialsApi />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Cadastrar material" }),
    );
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).queryByLabelText("Localização")).toBeNull();
    fireEvent.change(within(dialog).getByLabelText("Nome"), {
      target: { value: "Projetor BenQ" },
    });
    fireEvent.change(within(dialog).getByLabelText("Categoria"), {
      target: { value: "Projetor" },
    });
    fireEvent.click(within(dialog).getByLabelText("Individual"));
    fireEvent.change(within(dialog).getByLabelText("Patrimônio"), {
      target: { value: "PAT-7" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(sent("POST").body).toEqual({
        name: "Projetor BenQ",
        category: "Projetor",
        control: "individual",
        patrimony: "PAT-7",
        totalQuantity: 1,
      }),
    );
    expect(await screen.findByText(/Projetor BenQ cadastrado/)).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("edita um material sem permitir trocar o controle", async () => {
    routeFetch(() => response({ ...cable, totalQuantity: 10 }));
    render(<MaterialsApi />);
    const row = (await screen.findByText("Cabo HDMI")).closest("tr")!;
    fireEvent.click(within(row).getByRole("button", { name: "Editar" }));
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).queryByLabelText("Individual")).toBeNull();
    fireEvent.change(within(dialog).getByLabelText("Quantidade total"), {
      target: { value: "10" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(sent("PATCH").url).toContain("/admin/materiais/2"),
    );
    expect(sent("PATCH").body).toMatchObject({ totalQuantity: 10 });
    expect(sent("PATCH").body.control).toBeUndefined();
  });

  it("inativa após confirmar e mostra a recusa do servidor", async () => {
    routeFetch(() =>
      response(
        { message: "Este material tem itens aprovados ou em posse." },
        409,
      ),
    );
    render(<MaterialsApi />);
    const row = (await screen.findByText("Cabo HDMI")).closest("tr")!;
    fireEvent.click(within(row).getByRole("button", { name: "Inativar" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Confirmar inativação",
      }),
    );

    expect((await screen.findByRole("alert")).textContent).toContain(
      "aprovados ou em posse",
    );
    expect(sent("PATCH").body).toEqual({ active: false });
  });

  it("não diz que é demonstração", async () => {
    routeFetch();
    render(<MaterialsApi />);
    await screen.findByText("Projetor Epson");
    expect(screen.queryByText(/visualmente|demonstra/i)).toBeNull();
  });
});

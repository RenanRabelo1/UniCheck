// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfessorMaterialsApi } from "./ProfessorMaterialsApi";

const options = {
  rooms: [],
  authorization: null,
  items: [
    {
      type: "material",
      id: "1",
      name: "Projetor BenQ",
      detail: "Patrimônio PAT-100",
      category: "Projetor",
      roomId: null,
      total: 1,
      available: 1,
      locked: false,
      lockedReason: null,
    },
    {
      type: "material",
      id: "2",
      name: "Cabo HDMI",
      detail: null,
      category: "Cabos",
      roomId: null,
      total: 8,
      available: 8,
      locked: false,
      lockedReason: null,
    },
    {
      type: "key",
      id: "3",
      name: "Chave J-201",
      detail: "Laboratório",
      category: null,
      roomId: "1",
      total: 1,
      available: 1,
      locked: false,
      lockedReason: null,
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

describe("catálogo do professor com a API", () => {
  it("mostra os materiais reais, sem chaves nem dados fixos", async () => {
    fetchMock.mockImplementation(async () => response(options));
    render(<ProfessorMaterialsApi onNewRequest={() => undefined} />);

    expect(await screen.findByText("Projetor BenQ")).toBeTruthy();
    expect(screen.getByText("Patrimônio PAT-100")).toBeTruthy();
    expect(screen.getByText("Cabo HDMI")).toBeTruthy();
    expect(screen.queryByText("Chave J-201")).toBeNull();
    expect(screen.queryByText("Projetor multimídia")).toBeNull();
    expect(screen.queryByText(/demonstrativa/)).toBeNull();
  });

  it("filtra pelas categorias cadastradas", async () => {
    fetchMock.mockImplementation(async () => response(options));
    render(<ProfessorMaterialsApi onNewRequest={() => undefined} />);
    await screen.findByText("Projetor BenQ");

    fireEvent.change(screen.getByLabelText("Filtrar por categoria"), {
      target: { value: "Cabos" },
    });
    expect(screen.queryByText("Projetor BenQ")).toBeNull();
    expect(screen.getByText("Cabo HDMI")).toBeTruthy();
  });

  it("leva à Nova solicitação", async () => {
    fetchMock.mockImplementation(async () => response(options));
    const onNewRequest = vi.fn();
    render(<ProfessorMaterialsApi onNewRequest={onNewRequest} />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Nova solicitação" }),
    );
    expect(onNewRequest).toHaveBeenCalledTimes(1);
  });

  it("mostra o erro e permite tentar de novo", async () => {
    fetchMock.mockResolvedValueOnce(response({ message: "Falhou." }, 500));
    fetchMock.mockResolvedValueOnce(response(options));
    render(<ProfessorMaterialsApi onNewRequest={() => undefined} />);

    expect((await screen.findByRole("alert")).textContent).toContain("Falhou.");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Projetor BenQ")).toBeTruthy();
  });
});

// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { useDialogFocus } from "./useDialogFocus";

const response = (body: unknown, status = 200) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
const fetchMock = vi.fn();
const coordinator = {
  name: "Coordenação CCT",
  registration: "18024900",
  role: "coordinator",
  roleLabel: "Coordenador CCT",
};
const dashboard = {
  summary: {
    pendingItems: 0,
    approvedItems: 0,
    withdrawnItems: 0,
    pendingReturns: 0,
    openAlerts: 0,
  },
  recentRequests: [],
};

function routeFetch() {
  fetchMock.mockImplementation(async (url: string) => {
    if (url.endsWith("/auth/me")) return response(coordinator);
    if (url.endsWith("/auth/logout")) return response(null, 204);
    if (url.endsWith("/dashboard/admin")) return response(dashboard);
    return response([]);
  });
}

beforeEach(() => {
  vi.stubEnv("VITE_DATA_SOURCE", "api");
  vi.stubEnv("VITE_API_URL", "http://localhost:3000");
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  sessionStorage.clear();
  window.history.replaceState(null, "", "/");
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("login", () => {
  it("não mostra contas de teste com a API real", () => {
    render(<App />);
    expect(screen.queryByText(/Acesso rápido/)).toBeNull();
    expect(screen.queryByText("18024900")).toBeNull();
  });

  it("pede matrícula ao professor e e-mail ao aluno", () => {
    render(<App />);
    expect(screen.getByLabelText("Matrícula")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Aluno" }));
    expect(screen.getByLabelText("E-mail institucional")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Coordenador CCT" }));
    expect(screen.getByLabelText("Matrícula")).toBeTruthy();
  });

  it("anuncia o erro e marca o campo inválido", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Acessar/ }));
    expect((await screen.findByRole("alert")).textContent).toContain("Informe");
    expect(
      screen.getByLabelText("Matrícula").getAttribute("aria-invalid"),
    ).toBe("true");
  });
});

describe("sessão e endereço", () => {
  it("recarregar a página mantém a sessão e a tela", async () => {
    routeFetch();
    sessionStorage.setItem("unicheck_token", "token-salvo");
    window.history.replaceState(null, "", "/#/admin-alerts");
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Alertas de atraso" }),
    ).toBeTruthy();
    expect(String(fetchMock.mock.calls[0][0])).toContain("/auth/me");
  });

  it("token inválido volta para o login e limpa a sessão", async () => {
    fetchMock.mockImplementation(async () =>
      response({ message: "Sessão inválida." }, 401),
    );
    sessionStorage.setItem("unicheck_token", "vencido");
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Acesso ao Sistema" }),
    ).toBeTruthy();
    expect(sessionStorage.getItem("unicheck_token")).toBeNull();
  });

  it("sair avisa o servidor com o token da sessão", async () => {
    routeFetch();
    sessionStorage.setItem("unicheck_token", "token-salvo");
    render(<App />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Encerrar sessão" }),
    );

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([url]) =>
          String(url).endsWith("/auth/logout"),
        ),
      ).toBe(true),
    );
    const [, options] = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith("/auth/logout"),
    )!;
    expect(options.headers.Authorization).toBe("Bearer token-salvo");
    expect(sessionStorage.getItem("unicheck_token")).toBeNull();
  });

  it("navegar atualiza o endereço e o Voltar do navegador retorna", async () => {
    routeFetch();
    sessionStorage.setItem("unicheck_token", "token-salvo");
    render(<App />);
    const nav = await screen.findByRole("navigation", {
      name: "Navegação administrativa",
    });
    fireEvent.click(within(nav).getByRole("button", { name: /Alertas/ }));
    expect(window.location.hash).toBe("#/admin-alerts");

    window.history.replaceState(null, "", "/");
    fireEvent.popState(window);
    expect(
      await screen.findByRole("heading", { name: "Painel administrativo" }),
    ).toBeTruthy();
  });

  it("tem atalho para pular ao conteúdo", async () => {
    routeFetch();
    sessionStorage.setItem("unicheck_token", "token-salvo");
    window.history.replaceState(null, "", "/#/admin-alerts");
    render(<App />);
    await screen.findByRole("heading", { name: "Alertas de atraso" });

    const link = screen.getByRole("link", { name: "Pular para o conteúdo" });
    fireEvent.click(link);
    expect(document.activeElement?.id).toBe("conteudo");
    expect(window.location.hash).toBe("#/admin-alerts");
    expect(document.querySelectorAll("main")).toHaveLength(1);
  });
});

function DialogOpener() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      {open && <DialogExample onClose={() => setOpen(false)} />}
    </>
  );
}

function DialogExample({ onClose }: { onClose: () => void }) {
  const ref = useDialogFocus<HTMLDivElement>(onClose);
  return (
    <div ref={ref} role="dialog">
      <button type="button">Primeiro</button>
      <button type="button">Último</button>
    </div>
  );
}

describe("modal", () => {
  it("devolve o foco a quem abriu ao fechar", () => {
    render(<DialogOpener />);
    const opener = screen.getByRole("button", { name: "Abrir" });
    opener.focus();
    fireEvent.click(opener);
    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Primeiro" }),
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(opener);
  });

  it("foca o primeiro controle, fecha com Esc e prende o Tab", () => {
    const onClose = vi.fn();
    render(<DialogExample onClose={onClose} />);
    const first = screen.getByRole("button", { name: "Primeiro" });
    const last = screen.getByRole("button", { name: "Último" });

    expect(document.activeElement).toBe(first);
    last.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

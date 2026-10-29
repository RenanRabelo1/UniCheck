// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { RequestConfirmationScreen } from "./components/RequestConfirmationScreen";

afterEach(cleanup);

describe("fluxos principais do frontend", () => {
  it("navega do painel do professor para uma nova solicitação e encerra a sessão", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("E-mail institucional ou matrícula"), {
      target: { value: "2048819" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-demo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Acessar/ }));

    fireEvent.click(
      await screen.findByRole("button", { name: /Nova solicitação/ }),
    );

    expect(
      screen.getByRole("heading", { name: "Nova solicitação" }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getAllByRole("button", {
        name: /Voltar para (início|o painel inicial)/,
      })[0],
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Encerrar sessão" }),
    );

    expect(
      screen.getByRole("heading", { name: "Acesso ao Sistema" }),
    ).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain(
      "Sessão encerrada",
    );
  });

  it("abre o painel administrativo após o login do coordenador", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Coordenador CCT" }));
    fireEvent.change(screen.getByLabelText("E-mail institucional ou matrícula"), {
      target: { value: "18024900" },
    });
    fireEvent.change(screen.getByLabelText(/Senha/), {
      target: { value: "12345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Acessar/ }));

    expect(
      screen.getByRole("heading", { name: "Painel administrativo" }),
    ).toBeTruthy();
  });

  it("abre o painel demonstrativo do aluno", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Aluno" }));
    fireEvent.change(screen.getByLabelText("E-mail institucional ou matrícula"), {
      target: { value: "aluno.autorizado@unifor.br" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-demo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Acessar/ }));

    expect(
      await screen.findByRole("heading", { name: /Olá, Lucas Almeida/ }),
    ).toBeTruthy();
  });

  it("permite ao professor consultar o catálogo e trazer uma seleção ao formulário", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("E-mail institucional ou matrícula"), {
      target: { value: "2048819" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-demo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Acessar/ }));
    fireEvent.click(
      await screen.findByRole("button", { name: /Nova solicitação/ }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Consultar catálogo de materiais" }),
    );

    expect(
      screen.getByRole("heading", { name: "Materiais disponíveis" }),
    ).toBeTruthy();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Selecionar material" })[0],
    );
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Usar na solicitação demonstrativa",
      }),
    );

    expect(
      (screen.getByLabelText("Material *") as HTMLSelectElement).value,
    ).toBe("notebook");
  });

  it("abre o catálogo pelo item Materiais do painel do professor", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("E-mail institucional ou matrícula"), {
      target: { value: "2048819" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-demo" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Acessar/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Materiais" }));

    expect(
      screen.getByRole("heading", { name: "Materiais disponíveis" }),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", { name: "← Voltar ao painel" }),
    );
    expect(
      await screen.findByRole("heading", { name: /Olá, Prof\. Ricardo Mendes/ }),
    ).toBeTruthy();
  });

  it("exige o aceite do termo antes de confirmar uma solicitação", () => {
    const onConfirm = vi.fn();

    render(
      <RequestConfirmationScreen
        session={{
          name: "Prof. Teste",
          registration: "123",
          role: "professor",
          roleLabel: "Professor",
        }}
        onMyRequests={vi.fn()}
        request={{
          usageDate: "2026-09-24",
          location: "Sala J-02",
          pickupTime: "08:00",
          returnTime: "10:00",
          items: [
            {
              id: "key-j02",
              name: "Chave J-02",
              category: "Chave de laboratório",
              quantity: 1,
            },
          ],
        }}
        onBack={vi.fn()}
        onEdit={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Enviar solicitação/ }));

    expect(screen.getByRole("alert").textContent).toContain("aceitar o termo");
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RegisterScreen } from "./RegisterScreen";

afterEach(cleanup);

function fill(label: string | RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("tela de cadastro", () => {
  it("mostra os erros e não envia com dados inválidos", async () => {
    const onRegistered = vi.fn();
    render(<RegisterScreen onBackToLogin={vi.fn()} onRegistered={onRegistered} />);

    fireEvent.click(screen.getByRole("button", { name: /Criar conta/ }));

    expect(await screen.findByText("Informe seu nome completo.")).toBeTruthy();
    expect(onRegistered).not.toHaveBeenCalled();
  });

  it("avisa exatamente o que falta na senha", async () => {
    render(<RegisterScreen onBackToLogin={vi.fn()} onRegistered={vi.fn()} />);

    fill(/^Senha/, "abcdefgh");
    fireEvent.click(screen.getByRole("button", { name: /Criar conta/ }));

    expect(
      await screen.findByText(
        "A senha precisa ter 1 letra maiúscula e 1 caractere especial.",
      ),
    ).toBeTruthy();
  });

  it("recusa senhas diferentes", async () => {
    render(<RegisterScreen onBackToLogin={vi.fn()} onRegistered={vi.fn()} />);

    fill("Nome completo", "Maria da Silva");
    fill("E-mail institucional", "maria@unifor.br");
    fill("Matrícula", "2412345");
    fill("Curso", "Ciência da Computação");
    fill(/^Senha/, "Senha-segura-1!");
    fill("Confirmar senha", "Senha-diferente!");
    fireEvent.click(screen.getByRole("button", { name: /Criar conta/ }));

    expect(await screen.findByText("As senhas não conferem.")).toBeTruthy();
  });

  it("cria a sessão (modo demonstração) e troca o rótulo do campo por perfil", async () => {
    const onRegistered = vi.fn();
    render(<RegisterScreen onBackToLogin={vi.fn()} onRegistered={onRegistered} />);

    fireEvent.click(screen.getByRole("tab", { name: "Professor" }));
    expect(screen.getByLabelText("Área / Departamento")).toBeTruthy();

    fill("Nome completo", "Maria da Silva");
    fill("E-mail institucional", "maria@unifor.br");
    fill("Matrícula", "2412345");
    fill("Área / Departamento", "Computação");
    fill(/^Senha/, "Senha-segura-1!");
    fill("Confirmar senha", "Senha-segura-1!");
    fireEvent.click(screen.getByRole("button", { name: /Criar conta/ }));

    await vi.waitFor(() => expect(onRegistered).toHaveBeenCalledTimes(1));
    expect(onRegistered.mock.calls[0][0]).toMatchObject({
      role: "professor",
      dashboard: { name: "Maria da Silva", roleLabel: "Professor" },
    });
  });
});

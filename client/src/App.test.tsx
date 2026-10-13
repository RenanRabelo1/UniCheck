// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { RequestConfirmationScreen } from "./components/RequestConfirmationScreen";

describe("fluxos principais do frontend", () => {
  it("abre o painel administrativo após o login do coordenador", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("tab", { name: "Coordenador CCT" }));
    fireEvent.change(screen.getByLabelText("Matrícula"), {
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

  it("exige o aceite do termo antes de confirmar uma solicitação", () => {
    const onConfirm = vi.fn();

    render(
      <RequestConfirmationScreen
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

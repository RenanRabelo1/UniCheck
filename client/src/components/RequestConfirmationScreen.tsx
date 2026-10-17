import { useState } from "react";
import type { RequestConfirmationData } from "./RequestFlow.types";
import "./RequestConfirmationScreen.css";

export type {
  RequestConfirmationData,
  RequestConfirmationItem,
} from "./RequestFlow.types";

type RequestConfirmationScreenProps = {
  request: RequestConfirmationData;
  protocol?: string;
  onBack: () => void;
  onEdit: () => void;
  onConfirm: () => void | Promise<void>;
  onSuccess?: () => void;
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function RequestConfirmationScreen({
  request,
  protocol = "#REQ-2026-0842",
  onBack,
  onEdit,
  onConfirm,
  onSuccess,
}: RequestConfirmationScreenProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);

  async function confirmRequest() {
    if (!acceptedTerms) {
      setError(
        "Você precisa aceitar o termo de responsabilidade para continuar.",
      );
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await onConfirm();
      setIsSuccessOpen(true);
    } catch {
      setError("Não foi possível enviar a solicitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function finishFlow() {
    setIsSuccessOpen(false);
    onSuccess?.();
  }

  return (
    <main className="confirmation-page">
      <header className="confirmation-header">
        <div className="confirmation-header-content">
          <div className="dashboard-brand">
            <img src="/brand/unifor.svg" alt="Unifor" />
            <span />
            <div>
              <strong>Sistema CCT</strong>
              <small>Controle de Empréstimos · Bloco J-02</small>
            </div>
          </div>
          <button
            type="button"
            className="confirmation-home-button"
            onClick={onBack}
          >
            ← Voltar para início
          </button>
        </div>
      </header>

      <section className="confirmation-content">
        <div className="confirmation-context">
          <button type="button" onClick={onBack}>
            ← Voltar para o painel inicial
          </button>
          <span>
            <i /> Secretaria CCT · Bloco J-02
          </span>
        </div>

        <div
          className="confirmation-stepper"
          aria-label="Etapas da solicitação"
        >
          <span className="completed">
            <b>✓</b> Dados de utilização
          </span>
          <i />
          <span className="completed">
            <b>✓</b> Itens solicitados
          </span>
          <i />
          <span className="active">
            <b>3</b> Confirmação
          </span>
        </div>

        <section className="confirmation-intro">
          <div>
            <span className="confirmation-badge">
              <i /> Etapa final de validação
            </span>
            <small>Passo 3 de 3</small>
            <h1>Confirme sua solicitação</h1>
            <p>
              Revise as informações antes de enviar para análise da coordenação.
            </p>
          </div>
          <button type="button" onClick={onEdit}>
            ✎ Editar solicitação
          </button>
        </section>

        <section className="confirmation-card">
          <header>
            <div>
              <span aria-hidden="true">◷</span>
              <h2>1. Resumo da utilização</h2>
            </div>
            <button type="button" onClick={onEdit}>
              ✎ Editar
            </button>
          </header>
          <div className="confirmation-summary-grid">
            <SummaryField
              icon="□"
              label="Data de utilização"
              value={formatDate(request.usageDate)}
            />
            <SummaryField
              icon="⌂"
              label="Local de utilização"
              value={request.location}
            />
            <SummaryField
              icon="◷"
              label="Horário de início"
              value={request.pickupTime}
            />
            <SummaryField
              icon="◴"
              label="Horário previsto para devolução"
              value={request.returnTime}
            />
          </div>
          <div className="confirmation-notes">
            <strong>Observações informadas:</strong>
            <p>{request.notes?.trim() || "Nenhuma observação informada."}</p>
          </div>
        </section>

        <section className="confirmation-card">
          <header>
            <div>
              <span aria-hidden="true">▣</span>
              <h2>2. Itens da solicitação</h2>
            </div>
            <button type="button" onClick={onEdit}>
              ✎ Editar
            </button>
          </header>
          <div className="confirmation-items">
            {request.items.map((item) => (
              <article className="confirmation-item" key={item.id}>
                <span className="confirmation-item-icon" aria-hidden="true">
                  {item.category.toLowerCase().includes("chave") ? "⚿" : "▣"}
                </span>
                <div className="confirmation-item-copy">
                  <div>
                    <h3>{item.name}</h3>
                    <span>{item.category}</span>
                  </div>
                  {item.description && <p>{item.description}</p>}
                  {item.withdrawalLocation && (
                    <p>Retirada: {item.withdrawalLocation}</p>
                  )}
                  {item.project && (
                    <strong>Projeto vinculado: {item.project}</strong>
                  )}
                </div>
                <div className="confirmation-item-meta">
                  <small>Quantidade</small>
                  <b>
                    {item.quantity} {item.unit ?? "un."}
                  </b>
                  <span>
                    <i /> Aguardando análise
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="responsibility-card">
          <header>
            <span aria-hidden="true">§</span>
            <div>
              <h2>Termo de responsabilidade</h2>
              <p>Compromisso de zelo e devolução de bens patrimoniais</p>
            </div>
          </header>
          <div className="responsibility-content">
            <p>
              Ao enviar esta solicitação, declaro estar ciente de que os
              materiais e chaves liberados ficarão sob minha responsabilidade
              durante o período informado. Comprometo-me a utilizar os itens de
              forma adequada e devolvê-los à secretaria no horário previsto. Em
              caso de perda, dano, furto, roubo ou extravio, poderei ser
              responsabilizado conforme as normas institucionais aplicáveis.
            </p>
            <label>
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => {
                  setAcceptedTerms(event.target.checked);
                  if (event.target.checked) setError("");
                }}
              />
              <span>
                <strong>Li e aceito o termo de responsabilidade.</strong>
                <small>
                  Seu aceite eletrônico será registrado junto à solicitação com
                  data, hora e matrícula.
                </small>
              </span>
            </label>
            {error && (
              <p className="confirmation-error" role="alert">
                ⚠ {error}
              </p>
            )}
          </div>
        </section>

        <footer className="confirmation-actions">
          <p>
            <span aria-hidden="true">◇</span> Após o envio, a solicitação ficará
            pendente de aprovação pela coordenação e secretaria.
          </p>
          <div>
            <button
              type="button"
              className="confirmation-edit-button"
              onClick={onEdit}
            >
              ← Voltar e editar
            </button>
            <button
              type="button"
              className="confirmation-submit-button"
              disabled={isSubmitting}
              onClick={confirmRequest}
            >
              {isSubmitting ? "Enviando..." : "Enviar solicitação →"}
            </button>
          </div>
        </footer>
      </section>

      {isSuccessOpen && (
        <div
          className="confirmation-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="request-success-title"
        >
          <section className="confirmation-success">
            <span aria-hidden="true">✓</span>
            <div>
              <h2 id="request-success-title">Solicitação enviada!</h2>
              <p>
                Seu pedido foi registrado sob o protocolo{" "}
                <strong>{protocol}</strong> e está aguardando liberação do Bloco
                J-02.
              </p>
            </div>
            <button type="button" onClick={finishFlow}>
              Ir para Painel de Empréstimos
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

type SummaryFieldProps = { icon: string; label: string; value: string };

function SummaryField({ icon, label, value }: SummaryFieldProps) {
  return (
    <div className="confirmation-summary-field">
      <span aria-hidden="true">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

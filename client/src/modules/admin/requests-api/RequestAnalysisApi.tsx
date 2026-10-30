import { useCallback, useRef, useState } from "react";
import {
  decideAdminItem,
  getAdminRequest,
  type AdminDecision,
  type AdminRequest,
} from "../../../services/adminRequests";
import { useRequestData } from "../../solicitacoes/useRequestData";
import { formatRequestDate } from "./format";
import "../request-analysis/RequestAnalysisScreen.css";
import "./requestsApi.css";

type Props = { requestId: string | null; onBackToPending: () => void };
export function RequestAnalysisApi({ requestId, onBackToPending }: Props) {
  if (!requestId)
    return (
      <main className="request-analysis">
        <h1>Análise da solicitação</h1>
        <p>Selecione um pedido na lista de pendências.</p>
        <button
          className="admin-api-button"
          type="button"
          onClick={onBackToPending}
        >
          Ver pendências
        </button>
      </main>
    );
  return (
    <AnalysisLoader
      key={requestId}
      requestId={requestId}
      onBackToPending={onBackToPending}
    />
  );
}
function AnalysisLoader({
  requestId,
  onBackToPending,
}: Props & { requestId: string }) {
  const load = useCallback(
    (signal: AbortSignal) => getAdminRequest(requestId, signal),
    [requestId],
  );
  const { data, loading, error, retry } = useRequestData(load);
  if (data)
    return (
      <AnalysisEditor
        initialRequest={data}
        onBack={onBackToPending}
        onRefresh={retry}
      />
    );
  return (
    <main className="request-analysis">
      <button
        className="request-analysis__back"
        type="button"
        onClick={onBackToPending}
      >
        ← Voltar para pendências
      </button>
      <h1>Análise da solicitação</h1>
      {loading && <p role="status">Carregando solicitação…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button className="admin-api-button" type="button" onClick={retry}>
            Tentar novamente
          </button>
        </div>
      )}
    </main>
  );
}
function AnalysisEditor({
  initialRequest,
  onBack,
  onRefresh,
}: {
  initialRequest: AdminRequest;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [request, setRequest] = useState(initialRequest);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [refusingId, setRefusingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const locked = useRef(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const pending = request.items.filter(
    (item) => item.status === "PENDENTE",
  ).length;
  async function save(itemId: string, input: AdminDecision) {
    if (locked.current || needsRefresh) return;
    if (
      input.decision === "refuse" &&
      (!input.reason.trim() || input.reason.trim().length > 300)
    )
      return;
    locked.current = true;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await decideAdminItem(request.id, itemId, input);
      setRequest(updated);
      setRefusingId(null);
      setMessage("Parecer do item salvo com sucesso.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar o parecer.",
      );
      // A resposta pode ter se perdido depois do commit: releia antes de permitir novo envio.
      setNeedsRefresh(true);
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }
  return (
    <main
      className="request-analysis admin-requests-api"
      aria-labelledby="analysis-title"
    >
      <header className="request-analysis__header">
        <button
          type="button"
          className="request-analysis__back"
          disabled={saving}
          onClick={onBack}
        >
          ← Voltar para pendências
        </button>
        <p className="request-analysis__eyebrow">
          Solicitação {request.protocol}
        </p>
        <h1 id="analysis-title">Análise da solicitação</h1>
        <p className="request-analysis__subtitle">
          Cada parecer é salvo ao confirmar o item. A disponibilidade é
          conferida novamente na aprovação.
        </p>
        <button
          className="admin-api-button"
          type="button"
          onClick={onRefresh}
          disabled={saving}
        >
          Atualizar solicitação
        </button>
      </header>
      <section
        className="request-analysis__request-data"
        aria-label="Dados da solicitação"
      >
        <div>
          <p className="request-analysis__section-label">Solicitante</p>
          <h2>{request.requester?.name ?? "Solicitante não disponível"}</h2>
          {request.requester && (
            <p>
              {request.requester.roleLabel} · Matrícula{" "}
              {request.requester.registration}
            </p>
          )}
        </div>
        <dl className="request-analysis__metadata">
          <div>
            <dt>Local</dt>
            <dd>{request.room.label}</dd>
          </div>
          <div>
            <dt>Utilização</dt>
            <dd>
              {formatRequestDate(request.date)} · {request.pickupTime}–
              {request.returnTime}
            </dd>
          </div>
          <div>
            <dt>Observações</dt>
            <dd>{request.notes || "Sem observações."}</dd>
          </div>
        </dl>
      </section>
      <div aria-live="polite">
        {saving && <p role="status">Salvando parecer…</p>}
        {message && (
          <p role="status" className="admin-api-success">
            {message}
          </p>
        )}
      </div>
      {error && (
        <div role="alert" className="admin-api-error">
          <p>{error}</p>
          <p>
            Atualize a solicitação para conferir a situação registrada antes de
            tentar outra decisão.
          </p>
          <button
            className="admin-api-button"
            type="button"
            onClick={onRefresh}
          >
            Atualizar para conferir
          </button>
        </div>
      )}
      <section
        className="request-analysis__items"
        aria-labelledby="items-title"
      >
        <div className="request-analysis__section-heading">
          <h2 id="items-title">Parecer por item</h2>
          <span>{pending} pendente(s)</span>
        </div>
        <div className="request-analysis__item-list">
          {request.items.map((item) => (
            <article
              className="request-analysis__item"
              key={item.id}
              aria-label={item.name}
            >
              <div className="request-analysis__item-info">
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.detail}</p>
                </div>
                <strong>{item.statusLabel}</strong>
              </div>
              <p className="request-analysis__quantity">
                Quantidade solicitada: <strong>{item.quantity}</strong>
              </p>
              {item.refusalReason && (
                <p>Motivo da recusa: {item.refusalReason}</p>
              )}
              {item.status === "PENDENTE" && (
                <>
                  <div className="request-analysis__actions">
                    <button
                      className="request-analysis__approve"
                      type="button"
                      disabled={saving || needsRefresh}
                      onClick={() =>
                        void save(item.id, { decision: "approve" })
                      }
                    >
                      Aprovar e salvar
                    </button>
                    <button
                      className="request-analysis__reject"
                      type="button"
                      disabled={saving || needsRefresh}
                      onClick={() => setRefusingId(item.id)}
                    >
                      Recusar
                    </button>
                  </div>
                  {refusingId === item.id && (
                    <form
                      className="admin-api-refusal"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void save(item.id, {
                          decision: "refuse",
                          reason: (reasons[item.id] ?? "").trim(),
                        });
                      }}
                    >
                      <label className="request-analysis__reason">
                        Motivo da recusa (obrigatório)
                        <textarea
                          required
                          maxLength={300}
                          disabled={saving || needsRefresh}
                          value={reasons[item.id] ?? ""}
                          onChange={(event) =>
                            setReasons((previous) => ({
                              ...previous,
                              [item.id]: event.target.value,
                            }))
                          }
                        />
                        <small>
                          Até 300 caracteres. A recusa será salva ao confirmar.
                        </small>
                      </label>
                      <button
                        className="admin-api-button"
                        type="submit"
                        disabled={
                          saving ||
                          needsRefresh ||
                          !(reasons[item.id] ?? "").trim()
                        }
                      >
                        Confirmar recusa
                      </button>
                      <button
                        className="admin-api-button"
                        type="button"
                        disabled={saving}
                        onClick={() => setRefusingId(null)}
                      >
                        Cancelar
                      </button>
                    </form>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
      </section>
      <footer className="request-analysis__footer">
        <p>
          {pending
            ? `${pending} item(ns) ainda aguardam análise.`
            : "Todos os itens foram analisados."}
        </p>
        <button
          className="request-analysis__complete"
          type="button"
          disabled={saving}
          onClick={onBack}
        >
          Voltar à lista de pendências
        </button>
      </footer>
    </main>
  );
}

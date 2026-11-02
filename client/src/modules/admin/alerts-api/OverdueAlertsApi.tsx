import { useCallback, useState } from "react";

import {
  listAlerts,
  type AlertStatusFilter,
  type OverdueAlert,
} from "../../../services/alerts";
import { useRequestData } from "../../solicitacoes/useRequestData";
import { formatDateTime } from "../operations-api/operations.shared";
import { formatRequestDate } from "../requests-api/format";
import "../overdue-alerts/overdueAlerts.css";
import "../requests-api/requestsApi.css";

type TypeFilter = "all" | OverdueAlert["itemType"];

function matches(alert: OverdueAlert, term: string) {
  const search = term.trim().toLocaleLowerCase("pt-BR");
  if (!search) return true;
  return [
    alert.protocol,
    alert.itemName,
    alert.requester,
    alert.registration,
    alert.room,
  ].some((text) => text?.toLocaleLowerCase("pt-BR").includes(search));
}

/** Tela 12 conectada: ocorrências geradas pelo servidor às 22:40. A devolução é feita na Tela 11. */
export function OverdueAlertsApi({
  onRegisterReturn,
}: {
  onRegisterReturn: () => void;
}) {
  const [status, setStatus] = useState<AlertStatusFilter>("open");
  const [type, setType] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const load = useCallback(
    (signal: AbortSignal) => listAlerts(status, signal),
    [status],
  );
  const { data, loading, error, retry } = useRequestData(load);
  const alerts = data ?? [];
  const visible = alerts.filter(
    (alert) =>
      (type === "all" || alert.itemType === type) && matches(alert, search),
  );

  return (
    <section className="overdue-alerts" aria-labelledby="overdue-alerts-title">
      <header className="overdue-alerts__header">
        <div>
          <p className="overdue-alerts__eyebrow">Administrativo</p>
          <h1 id="overdue-alerts-title">Alertas de atraso</h1>
          <p>Itens ainda não devolvidos até as 22:40.</p>
        </div>
        <button
          className="admin-api-button"
          type="button"
          onClick={retry}
          disabled={loading}
        >
          Atualizar
        </button>
      </header>

      <div className="overdue-alerts__summary" aria-label="Resumo de atrasos">
        <article>
          <strong>{alerts.length}</strong>
          <span>ocorrências listadas</span>
        </article>
        <article>
          <strong>
            {alerts.filter((alert) => alert.itemType === "key").length}
          </strong>
          <span>chaves</span>
        </article>
        <article>
          <strong>
            {alerts.filter((alert) => alert.status === "open").length}
          </strong>
          <span>aguardando devolução</span>
        </article>
      </div>

      <div className="overdue-alerts__toolbar">
        <label>
          Pesquisar
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          Situação
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AlertStatusFilter)
            }
          >
            <option value="open">Abertos</option>
            <option value="resolved">Resolvidos</option>
            <option value="all">Todos</option>
          </select>
        </label>
        <label>
          Tipo
          <select
            value={type}
            onChange={(event) => setType(event.target.value as TypeFilter)}
          >
            <option value="all">Todos</option>
            <option value="key">Chave</option>
            <option value="material">Material</option>
          </select>
        </label>
      </div>

      {loading && <p role="status">Carregando alertas…</p>}
      {error && (
        <div className="admin-api-error" role="alert">
          <p>{error}</p>
          <button className="admin-api-button" type="button" onClick={retry}>
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="overdue-alerts__list" aria-live="polite">
          {visible.map((alert) => (
            <article className="overdue-alerts__item" key={alert.id}>
              <div className="overdue-alerts__item-main">
                <span className="overdue-alerts__tag">
                  {alert.itemType === "key" ? "Chave" : "Material"}
                </span>
                <h2>{alert.itemName}</h2>
                <p>
                  <strong>{alert.protocol}</strong> ·{" "}
                  {alert.requester ?? "Solicitante não encontrado"}
                  {alert.registration ? ` · ${alert.registration}` : ""}
                </p>
                <p>{alert.contact ?? "Contato não informado"}</p>
                {alert.room && (
                  <p>
                    Sala {alert.room} · Chave {alert.keyType}
                  </p>
                )}
                <p>
                  Retirada:{" "}
                  {alert.withdrawnAt
                    ? formatDateTime(alert.withdrawnAt)
                    : "não registrada"}
                  {" · "}Prazo: {formatRequestDate(alert.dueDate)} às{" "}
                  {alert.dueTime}
                </p>
              </div>
              <div className="overdue-alerts__item-status">
                <strong>
                  {alert.status === "open" ? "Em atraso" : "Resolvido"}
                </strong>
                <span>
                  {alert.resolvedAt
                    ? `Devolvido em ${formatDateTime(alert.resolvedAt)}`
                    : `Gerado em ${formatDateTime(alert.createdAt)}`}
                </span>
              </div>
              {alert.status === "open" && (
                <div className="overdue-alerts__actions">
                  <button type="button" onClick={onRegisterReturn}>
                    Registrar devolução
                  </button>
                </div>
              )}
            </article>
          ))}
          {visible.length === 0 && (
            <p className="overdue-alerts__empty">Nenhum alerta encontrado.</p>
          )}
        </div>
      )}
    </section>
  );
}

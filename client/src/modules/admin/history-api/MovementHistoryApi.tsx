import { useCallback, useState } from "react";

import {
  listHistory,
  type HistoryFilters,
  type HistoryItem,
} from "../../../services/history";
import { useRequestData } from "../../solicitacoes/useRequestData";
import { formatDateTime } from "../operations-api/operations.shared";
import "../movement-history/movementHistory.css";
import "../requests-api/requestsApi.css";

const emptyFilters: HistoryFilters = {
  search: "",
  material: "",
  room: "",
  status: "",
  from: "",
  to: "",
};

const statuses = [
  ["PENDENTE", "Pendente"],
  ["APROVADO", "Aprovado"],
  ["RECUSADO", "Recusado"],
  ["RETIRADO", "Em posse"],
  ["ATRASADO", "Em atraso"],
  ["DEVOLVIDO", "Devolvido"],
];

/** Reaproveita as cores do histórico: cada situação cai em uma das quatro faixas do CSS. */
function statusTone(status: string) {
  if (status === "ATRASADO") return "atrasado";
  if (status === "RECUSADO") return "inativo";
  return status === "DEVOLVIDO" ? "concluido" : "pendente";
}

function describe(record: HistoryItem["withdrawal"]) {
  if (!record) return "Não registrada";
  const who = record.by ?? "Responsável não encontrado";
  const receiver = record.responsible ? ` · ${record.responsible}` : "";
  return `${formatDateTime(record.at)} · ${who}${receiver}`;
}

/** Tela 16 conectada: cada linha é um item, com ou sem movimentação. */
export function MovementHistoryApi() {
  const [draft, setDraft] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const load = useCallback(
    (signal: AbortSignal) => listHistory(applied, signal),
    [applied],
  );
  const { data, loading, error, retry } = useRequestData(load);
  const items = data ?? [];

  const update = (key: keyof HistoryFilters, value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  function apply(filters: HistoryFilters) {
    setSelected(null);
    setApplied(filters);
  }

  return (
    <section
      className="movement-history"
      aria-labelledby="movement-history-title"
    >
      <header className="movement-history__header">
        <div>
          <p className="movement-history__eyebrow">Administração</p>
          <h1 id="movement-history-title">Histórico de movimentações</h1>
          <p>
            Consulte decisões, retiradas, devoluções e atrasos de cada item.
          </p>
        </div>
      </header>

      <div
        className="movement-history__filters"
        aria-label="Filtros do histórico"
      >
        <label>
          Buscar
          <input
            value={draft.search}
            onChange={(event) => update("search", event.target.value)}
            placeholder="Protocolo, pessoa, matrícula ou item"
          />
        </label>
        <label>
          Material
          <input
            value={draft.material}
            onChange={(event) => update("material", event.target.value)}
          />
        </label>
        <label>
          Sala
          <input
            value={draft.room}
            onChange={(event) => update("room", event.target.value)}
          />
        </label>
        <label>
          Situação
          <select
            value={draft.status}
            onChange={(event) => update("status", event.target.value)}
          >
            <option value="">Todas</option>
            {statuses.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          De
          <input
            type="date"
            value={draft.from}
            onChange={(event) => update("from", event.target.value)}
          />
        </label>
        <label>
          Até
          <input
            type="date"
            value={draft.to}
            onChange={(event) => update("to", event.target.value)}
          />
        </label>
        <div className="movement-history__filter-actions">
          <button type="button" onClick={() => apply(draft)}>
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(emptyFilters);
              apply(emptyFilters);
            }}
          >
            Limpar
          </button>
        </div>
      </div>

      {loading && <p role="status">Carregando histórico…</p>}
      {error && (
        <div className="admin-api-error" role="alert">
          <p>{error}</p>
          <button className="admin-api-button" type="button" onClick={retry}>
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="movement-history__results" aria-live="polite">
          <div className="movement-history__result-summary">
            <strong>{items.length}</strong> item(ns) encontrado(s)
          </div>
          <div className="movement-history__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Solicitante</th>
                  <th>Item</th>
                  <th>Situação</th>
                  <th>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.itemId}>
                    <td>
                      {item.protocol}
                      <small>Sala {item.room}</small>
                    </td>
                    <td>
                      {item.requester ?? "Solicitante não encontrado"}
                      <small>{item.registration}</small>
                    </td>
                    <td>{item.itemName}</td>
                    <td>
                      <span
                        className={`movement-history__status movement-history__status--${statusTone(item.status)}`}
                      >
                        {item.statusLabel}
                      </span>
                      {item.wasLate && <small>Teve atraso</small>}
                    </td>
                    <td>
                      <button type="button" onClick={() => setSelected(item)}>
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="movement-history__empty">
                      Nenhum item corresponde aos filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <aside
          className="movement-history__dossier"
          aria-labelledby="movement-dossier-title"
        >
          <div className="movement-history__dossier-heading">
            <div>
              <p className="movement-history__eyebrow">{selected.itemName}</p>
              <h2 id="movement-dossier-title">{selected.protocol}</h2>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Fechar detalhes"
            >
              Fechar
            </button>
          </div>
          <dl>
            <div>
              <dt>Situação final</dt>
              <dd>{selected.statusLabel}</dd>
            </div>
            <div>
              <dt>Decisão</dt>
              <dd>
                {selected.decision
                  ? `${selected.decision.outcome === "refused" ? "Recusado" : "Aprovado"} em ${formatDateTime(selected.decision.at)} · ${selected.decision.by ?? "Responsável não encontrado"}`
                  : "Não registrada"}
              </dd>
            </div>
            {selected.decision?.reason && (
              <div>
                <dt>Motivo da recusa</dt>
                <dd>{selected.decision.reason}</dd>
              </div>
            )}
            <div>
              <dt>Retirada</dt>
              <dd>{describe(selected.withdrawal)}</dd>
            </div>
            {selected.keyDelivered && (
              <div>
                <dt>Chave entregue</dt>
                <dd>{selected.keyDelivered}</dd>
              </div>
            )}
            {selected.withdrawal?.notes && (
              <div>
                <dt>Observação da retirada</dt>
                <dd>{selected.withdrawal.notes}</dd>
              </div>
            )}
            <div>
              <dt>Devolução</dt>
              <dd>{describe(selected.return)}</dd>
            </div>
            {selected.return?.condition && (
              <div>
                <dt>Condição na devolução</dt>
                <dd>{selected.return.condition}</dd>
              </div>
            )}
            {selected.return?.notes && (
              <div>
                <dt>Observação da devolução</dt>
                <dd>{selected.return.notes}</dd>
              </div>
            )}
          </dl>
        </aside>
      )}
    </section>
  );
}

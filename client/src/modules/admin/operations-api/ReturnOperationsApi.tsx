import { useRef, useState } from "react";

import { listAdminRequests } from "../../../services/adminRequests";
import { registerReturn } from "../../../services/movements";
import { useRequestData } from "../../solicitacoes/useRequestData";
import { formatRequestDate } from "../requests-api/format";
import type { ReturnCondition } from "../return-operations/return-operations.types";
import {
  IN_POSSESSION_STATUSES,
  errorMessage,
  filterByItemStatus,
  formatDateTime,
  matchesSearch,
} from "./operations.shared";
import "../return-operations/return-operations.css";
import "../requests-api/requestsApi.css";

const conditions: Array<{ value: ReturnCondition; label: string }> = [
  { value: "INTEGRO", label: "Íntegro" },
  { value: "AVARIADO", label: "Avariado" },
  { value: "INCOMPLETO", label: "Incompleto" },
];
type Draft = { checked: boolean; condition: ReturnCondition | "" };
type ReturnDone = { protocol: string; itemNames: string[]; late: number };

/** Tela 11 conectada: devolução gravada pelo servidor, que também resolve o alerta de atraso. */
export function ReturnOperationsApi() {
  const { data, loading, error, retry } = useRequestData(listAdminRequests);
  const [done, setDone] = useState<ReturnDone | null>(null);
  const requests = filterByItemStatus(data, IN_POSSESSION_STATUSES);

  return (
    <section className="return-operations" aria-labelledby="return-operations-title">
      <header className="return-operations__header">
        <div>
          <p className="return-operations__eyebrow">Recebimento presencial</p>
          <h1 id="return-operations-title">Devolução e baixa de custódia</h1>
          <p>Confira os itens que ainda estão em posse do solicitante.</p>
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

      {done && (
        <aside className="return-operations__success" role="status">
          <strong>Devolução registrada.</strong>
          <span>
            {done.protocol}: {done.itemNames.join(", ")}
            {done.late > 0 ? ` (${done.late} item(ns) em atraso)` : ""}
          </span>
        </aside>
      )}
      {loading && <p role="status">Carregando itens em posse…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button className="admin-api-button" type="button" onClick={retry}>
            Tentar novamente
          </button>
        </div>
      )}
      {!loading && !error && requests.length === 0 && (
        <p>Nenhum item em posse aguardando devolução.</p>
      )}
      {!loading && !error && requests.length > 0 && (
        <ReturnForm
          requests={requests}
          onDone={(result) => {
            setDone(result);
            retry();
          }}
          onFailure={retry}
        />
      )}
    </section>
  );
}

function ReturnForm({
  requests,
  onDone,
  onFailure,
}: {
  requests: ReturnType<typeof filterByItemStatus>;
  onDone: (result: ReturnDone) => void;
  onFailure: () => void;
}) {
  const [search, setSearch] = useState("");
  const [requestId, setRequestId] = useState(requests[0].id);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [notes, setNotes] = useState("");
  const [homologated, setHomologated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");
  const locked = useRef(false);

  const visible = requests.filter((candidate) => matchesSearch(candidate, search));
  const request =
    requests.find((candidate) => candidate.id === requestId) ?? requests[0];
  const checkedItems = request.items.filter((item) => drafts[item.id]?.checked);
  const complete =
    checkedItems.length > 0 &&
    checkedItems.every((item) => drafts[item.id]?.condition);
  const mayConfirm = homologated && complete && notes.length <= 200 && !saving;

  function selectRequest(id: string) {
    setRequestId(id);
    setDrafts({});
    setHomologated(false);
    setProblem("");
  }
  function updateItem(itemId: string, patch: Partial<Draft>) {
    setDrafts((current) => {
      const base: Draft = current[itemId] ?? { checked: false, condition: "" };
      return { ...current, [itemId]: { ...base, ...patch } };
    });
  }

  async function confirm() {
    if (locked.current || !mayConfirm) return;
    locked.current = true;
    setSaving(true);
    setProblem("");
    const registered: string[] = [];
    let late = 0;
    try {
      for (const item of checkedItems) {
        const movement = await registerReturn({
          requestId: request.id,
          itemId: item.id,
          condition: drafts[item.id].condition as ReturnCondition,
          notes: notes.trim() || undefined,
        });
        registered.push(movement.itemName);
        if (movement.wasLate) late += 1;
      }
      onDone({ protocol: request.protocol, itemNames: registered, late });
    } catch (cause) {
      const base = errorMessage(cause, "Não foi possível registrar a devolução.");
      setProblem(
        registered.length
          ? `${base} Já registrados: ${registered.join(", ")}. A lista foi atualizada.`
          : base,
      );
      if (registered.length) onFailure();
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="return-operations__layout">
      <aside className="return-operations__search" aria-label="Itens em posse">
        <label htmlFor="custody-search">Buscar item em posse</label>
        <input
          id="custody-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Protocolo, solicitante ou item"
        />
        <div className="return-operations__record-list">
          {visible.map((candidate) => (
            <button
              className={candidate.id === request.id ? "is-selected" : ""}
              key={candidate.id}
              onClick={() => selectRequest(candidate.id)}
              type="button"
            >
              <strong>{candidate.protocol}</strong>
              <span>{candidate.requester?.name ?? "Solicitante não disponível"}</span>
              <small>{candidate.items.length} item(ns) em posse</small>
            </button>
          ))}
          {visible.length === 0 && (
            <p className="return-operations__empty">Nenhum item em posse encontrado.</p>
          )}
        </div>
      </aside>

      <div className="return-operations__content">
        <section className="return-operations__dossier" aria-labelledby="dossier-title">
          <div>
            <p className="return-operations__eyebrow">Dossiê do solicitante</p>
            <h2 id="dossier-title">
              {request.requester?.name ?? "Solicitante não disponível"}
            </h2>
          </div>
          <dl>
            <div><dt>Matrícula</dt><dd>{request.requester?.registration ?? "—"}</dd></div>
            <div><dt>Perfil</dt><dd>{request.requester?.roleLabel ?? "—"}</dd></div>
            <div><dt>Local</dt><dd>{request.room.label}</dd></div>
            <div>
              <dt>Devolução prevista</dt>
              <dd>{formatRequestDate(request.date)} · {request.returnTime}</dd>
            </div>
          </dl>
        </section>

        <section className="return-operations__checklist" aria-labelledby="checklist-title">
          <div className="return-operations__section-heading">
            <div>
              <p className="return-operations__eyebrow">Conferência por item</p>
              <h2 id="checklist-title">Checklist de recebimento</h2>
            </div>
            <span>{request.protocol}</span>
          </div>
          {request.items.map((item) => {
            const draft = drafts[item.id];
            return (
              <article className="return-operations__item" key={item.id}>
                <label className="return-operations__item-check">
                  <input
                    checked={draft?.checked ?? false}
                    disabled={saving}
                    onChange={(event) => updateItem(item.id, { checked: event.target.checked })}
                    type="checkbox"
                  />
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.type === "key" ? "Chave" : "Material"} · {item.quantity} un. ·{" "}
                      {item.status === "ATRASADO" ? "EM ATRASO · " : ""}
                      retirada em {formatDateTime(item.updatedAt)}
                    </small>
                  </span>
                </label>
                <label>
                  Condição de devolução
                  <select
                    disabled={!draft?.checked || saving}
                    onChange={(event) =>
                      updateItem(item.id, { condition: event.target.value as ReturnCondition })
                    }
                    value={draft?.condition ?? ""}
                  >
                    <option value="">Selecione</option>
                    {conditions.map((condition) => (
                      <option key={condition.value} value={condition.value}>
                        {condition.label}
                      </option>
                    ))}
                  </select>
                </label>
              </article>
            );
          })}
        </section>

        <section className="return-operations__homologation" aria-labelledby="homologation-title">
          <div>
            <p className="return-operations__eyebrow">Encerramento</p>
            <h2 id="homologation-title">Termo de homologação</h2>
            <p>
              Declaro que os itens marcados foram conferidos presencialmente. A data e a hora
              da devolução são registradas pelo servidor ao confirmar.
            </p>
          </div>
          <label className="return-operations__date-field" htmlFor="return-notes">
            Observações (opcional)
            <input
              id="return-notes"
              value={notes}
              maxLength={200}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <label className="return-operations__consent">
            <input
              checked={homologated}
              onChange={(event) => setHomologated(event.target.checked)}
              type="checkbox"
            />
            Homologo a conferência e a condição informada para cada item.
          </label>
          <button
            className="return-operations__confirm"
            disabled={!mayConfirm}
            onClick={confirm}
            type="button"
          >
            {saving ? "Registrando…" : "Confirmar Devolução e Baixar Custódia"}
          </button>
          {problem && <p role="alert" className="return-operations__error">{problem}</p>}
        </section>
      </div>
    </div>
  );
}

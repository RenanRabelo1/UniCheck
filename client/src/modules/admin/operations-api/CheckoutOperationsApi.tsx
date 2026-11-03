import { useRef, useState } from "react";
import type { FormEvent } from "react";

import { listAdminRequests } from "../../../services/adminRequests";
import { registerWithdrawal } from "../../../services/movements";
import { listKeys, type RoomKey } from "../../../services/rooms";
import { useRequestData } from "../../solicitacoes/useRequestData";
import { formatRequestDate } from "../requests-api/format";
import {
  APPROVED_STATUSES,
  errorMessage,
  filterByItemStatus,
  formatDateTime,
  matchesSearch,
} from "./operations.shared";
import "../checkout-operations/checkout-operations.css";
import "../requests-api/requestsApi.css";

type WithdrawalDone = { protocol: string; itemNames: string[] };

const loadCheckout = async (signal: AbortSignal) => {
  const [requests, keys] = await Promise.all([
    listAdminRequests(signal),
    listKeys(signal),
  ]);
  return { requests, keys };
};

/** Tela 10 conectada: retirada presencial gravada pelo servidor, um item por vez. */
export function CheckoutOperationsApi() {
  const { data, loading, error, retry } = useRequestData(loadCheckout);
  const [done, setDone] = useState<WithdrawalDone | null>(null);
  const requests = filterByItemStatus(data?.requests, APPROVED_STATUSES);

  return (
    <section className="checkout-operations" aria-labelledby="checkout-title">
      <header className="checkout-operations__header">
        <div>
          <p className="checkout-operations__eyebrow">Operação presencial</p>
          <h1 id="checkout-title">Retirada e transferência de custódia</h1>
          <p>Selecione os itens aprovados que o solicitante está retirando.</p>
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
        <output className="checkout-operations__result" aria-live="polite">
          <strong>Retirada registrada</strong>
          <span>
            {done.protocol}: {done.itemNames.join(", ")}
          </span>
        </output>
      )}
      {loading && <p role="status">Carregando solicitações aprovadas…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button className="admin-api-button" type="button" onClick={retry}>
            Tentar novamente
          </button>
        </div>
      )}
      {!loading && !error && requests.length === 0 && (
        <p>Nenhuma solicitação com itens aprovados aguardando retirada.</p>
      )}
      {!loading && !error && requests.length > 0 && (
        <CheckoutForm
          requests={requests}
          keys={data?.keys ?? []}
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

function CheckoutForm({
  requests,
  keys,
  onDone,
  onFailure,
}: {
  requests: ReturnType<typeof filterByItemStatus>;
  keys: RoomKey[];
  onDone: (result: WithdrawalDone) => void;
  onFailure: () => void;
}) {
  const [search, setSearch] = useState("");
  const [requestId, setRequestId] = useState(requests[0].id);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [deliveredKeys, setDeliveredKeys] = useState<Record<string, string>>(
    {},
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [responsibleName, setResponsibleName] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");
  const locked = useRef(false);

  const visible = requests.filter((candidate) =>
    matchesSearch(candidate, search),
  );
  const request =
    requests.find((candidate) => candidate.id === requestId) ?? requests[0];
  const roomKeys = keys.filter(
    (key) => key.active && key.room.value === request.room.value,
  );
  const keysMissing = request.items.some(
    (item) =>
      item.type === "key" &&
      selectedItemIds.includes(item.id) &&
      !deliveredKeys[item.id],
  );
  const disabled =
    saving ||
    !acceptedTerms ||
    selectedItemIds.length === 0 ||
    keysMissing ||
    notes.length > 300;

  function selectRequest(id: string) {
    setRequestId(id);
    setSelectedItemIds([]);
    setDeliveredKeys({});
    setAcceptedTerms(false);
    setProblem("");
  }
  function toggleItem(itemId: string) {
    setSelectedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || disabled) return;
    locked.current = true;
    setSaving(true);
    setProblem("");
    const registered: string[] = [];
    try {
      for (const itemId of selectedItemIds) {
        const movement = await registerWithdrawal({
          requestId: request.id,
          itemId,
          termAccepted: acceptedTerms,
          keyId: deliveredKeys[itemId],
          responsibleName: responsibleName.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        registered.push(movement.itemName);
      }
      onDone({ protocol: request.protocol, itemNames: registered });
    } catch (cause) {
      const base = errorMessage(
        cause,
        "Não foi possível registrar a retirada.",
      );
      setProblem(
        registered.length
          ? `${base} Já registrados: ${registered.join(", ")}. A lista foi atualizada.`
          : base,
      );
      // Parte dos itens pode ter sido gravada: releia antes de permitir novo envio.
      if (registered.length) onFailure();
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="checkout-operations__layout">
      <aside
        className="checkout-operations__requests"
        aria-label="Solicitações aprovadas"
      >
        <label htmlFor="checkout-search">Buscar solicitação aprovada</label>
        <input
          id="checkout-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Protocolo, nome ou matrícula"
        />
        <div className="checkout-operations__request-list">
          {visible.map((candidate) => (
            <button
              className={candidate.id === request.id ? "is-selected" : ""}
              key={candidate.id}
              type="button"
              onClick={() => selectRequest(candidate.id)}
            >
              <strong>{candidate.protocol}</strong>
              <span>
                {candidate.requester?.name ?? "Solicitante não disponível"}
              </span>
              <small>{candidate.items.length} item(ns) aprovado(s)</small>
            </button>
          ))}
          {visible.length === 0 && <p>Nenhuma solicitação encontrada.</p>}
        </div>
      </aside>

      <form className="checkout-operations__form" onSubmit={confirm}>
        <section
          className="checkout-operations__panel"
          aria-labelledby="dossier-title"
        >
          <div className="checkout-operations__panel-heading">
            <div>
              <p className="checkout-operations__eyebrow">
                Dossiê do solicitante
              </p>
              <h2 id="dossier-title">
                {request.requester?.name ?? "Solicitante não disponível"}
              </h2>
            </div>
            <span className="checkout-operations__approved">Aprovada</span>
          </div>
          <dl className="checkout-operations__dossier">
            <div>
              <dt>Protocolo</dt>
              <dd>{request.protocol}</dd>
            </div>
            <div>
              <dt>Perfil</dt>
              <dd>{request.requester?.roleLabel ?? "—"}</dd>
            </div>
            <div>
              <dt>Matrícula</dt>
              <dd>{request.requester?.registration ?? "—"}</dd>
            </div>
            <div>
              <dt>Solicitada em</dt>
              <dd>{formatDateTime(request.createdAt)}</dd>
            </div>
            <div>
              <dt>Local</dt>
              <dd>{request.room.label}</dd>
            </div>
            <div>
              <dt>Uso previsto</dt>
              <dd>
                {formatRequestDate(request.date)} · {request.pickupTime}–
                {request.returnTime}
              </dd>
            </div>
          </dl>
        </section>

        <section
          className="checkout-operations__panel"
          aria-labelledby="items-title"
        >
          <div className="checkout-operations__panel-heading">
            <div>
              <p className="checkout-operations__eyebrow">Etapa 1</p>
              <h2 id="items-title">Itens aprovados para retirada</h2>
            </div>
            <span>{selectedItemIds.length} selecionado(s)</span>
          </div>
          <div className="checkout-operations__items">
            {request.items.map((item) => (
              <div key={item.id}>
                <label className="checkout-operations__item">
                  <input
                    type="checkbox"
                    checked={selectedItemIds.includes(item.id)}
                    disabled={saving}
                    onChange={() => toggleItem(item.id)}
                  />
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.quantity} un.
                      {item.detail ? ` · ${item.detail}` : ""}
                    </small>
                  </span>
                  <em>{item.type === "key" ? "Chave" : "Material"}</em>
                </label>
                {item.type === "key" && selectedItemIds.includes(item.id) && (
                  <label>
                    Chave entregue
                    <select
                      required
                      value={deliveredKeys[item.id] ?? ""}
                      disabled={saving}
                      onChange={(event) =>
                        setDeliveredKeys((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                    >
                      <option value="">Selecione</option>
                      {roomKeys.map((key) => (
                        <option key={key.id} value={key.id}>
                          {key.typeLabel}
                          {key.inPossession ? " (em posse)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            ))}
          </div>
        </section>

        <section
          className="checkout-operations__panel checkout-operations__confirmation"
          aria-labelledby="confirmation-title"
        >
          <div>
            <p className="checkout-operations__eyebrow">Etapa 2</p>
            <h2 id="confirmation-title">Responsável e termo</h2>
          </div>
          <label htmlFor="checkout-responsible">
            Quem está retirando (opcional)
          </label>
          <input
            id="checkout-responsible"
            value={responsibleName}
            maxLength={100}
            placeholder="Em branco: o próprio solicitante"
            onChange={(event) => setResponsibleName(event.target.value)}
          />
          <label htmlFor="checkout-notes">Observações (opcional)</label>
          <input
            id="checkout-notes"
            value={notes}
            maxLength={300}
            onChange={(event) => setNotes(event.target.value)}
          />
          <label className="checkout-operations__terms">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>
              Confirmo o aceite do termo de responsabilidade pelo solicitante.
            </span>
          </label>
          <button
            className="checkout-operations__submit"
            disabled={disabled}
            type="submit"
          >
            {saving
              ? "Registrando…"
              : "Confirmar Retirada e Transferir Custódia"}
          </button>
          {!saving &&
            (!acceptedTerms || selectedItemIds.length === 0 || keysMissing) && (
              <p className="checkout-operations__validation" role="status">
                Selecione ao menos um item, identifique as chaves entregues e
                confirme o aceite do termo para continuar.
              </p>
            )}
          {problem && <p role="alert">{problem}</p>}
        </section>
      </form>
    </div>
  );
}

import { useMemo, useState } from "react";

import { custodyRecordsMock } from "./return-operations.mock";
import type {
  CustodyRecord,
  DemonstrativeReturnPayload,
  ItemReturnDraft,
  ReturnCondition,
  ReturnOperationsProps,
} from "./return-operations.types";
import "./return-operations.css";

const conditions: Array<{ value: ReturnCondition; label: string }> = [
  { value: "INTEGRO", label: "Íntegro" },
  { value: "AVARIADO", label: "Avariado" },
  { value: "INCOMPLETO", label: "Incompleto" },
];

const displayDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

const newDraft = (record: CustodyRecord): Record<string, ItemReturnDraft> =>
  Object.fromEntries(record.items.map((item) => [item.id, { checked: false, condition: "" }]));

export function ReturnOperations({ onReturnConfirmed }: ReturnOperationsProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(custodyRecordsMock[0].id);
  const [returnedAt, setReturnedAt] = useState("2026-10-16T15:00");
  const [homologated, setHomologated] = useState(false);
  const [confirmedPayload, setConfirmedPayload] = useState<DemonstrativeReturnPayload | null>(null);
  const selectedRecord = custodyRecordsMock.find((record) => record.id === selectedId) ?? custodyRecordsMock[0];
  const [itemDrafts, setItemDrafts] = useState<Record<string, ItemReturnDraft>>(() => newDraft(selectedRecord));

  const visibleRecords = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return custodyRecordsMock;

    return custodyRecordsMock.filter((record) =>
      [record.protocol, record.requester.name, record.requester.registration, ...record.items.map((item) => item.description)]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(term),
    );
  }, [search]);

  const isAfterWithdrawal = new Date(returnedAt).getTime() > new Date(selectedRecord.withdrawnAt).getTime();
  const areItemsComplete = selectedRecord.items.every((item) => {
    const draft = itemDrafts[item.id];
    return draft?.checked && draft.condition;
  });
  const mayConfirm = homologated && isAfterWithdrawal && areItemsComplete;

  const selectRecord = (record: CustodyRecord) => {
    setSelectedId(record.id);
    setItemDrafts(newDraft(record));
    setHomologated(false);
    setConfirmedPayload(null);
    setReturnedAt(record.withdrawnAt);
  };

  const updateItem = (itemId: string, patch: Partial<ItemReturnDraft>) => {
    setItemDrafts((current) => ({
      ...current,
      [itemId]: { ...current[itemId], ...patch },
    }));
    setConfirmedPayload(null);
  };

  const confirmReturn = () => {
    if (!mayConfirm) return;

    const payload: DemonstrativeReturnPayload = {
      custodyId: selectedRecord.id,
      returnedAt,
      homologated: true,
      items: selectedRecord.items.map((item) => ({
        itemId: item.id,
        condition: itemDrafts[item.id].condition as ReturnCondition,
      })),
    };

    setConfirmedPayload(payload);
    onReturnConfirmed?.(payload);
  };

  return (
    <section className="return-operations" aria-labelledby="return-operations-title">
      <header className="return-operations__header">
        <div>
          <p className="return-operations__eyebrow">Recebimento presencial</p>
          <h1 id="return-operations-title">Devolução e baixa de custódia</h1>
          <p>Conferência demonstrativa de itens ainda em posse do solicitante.</p>
        </div>
        <span className="return-operations__mode">Modo demonstrativo — sem persistência</span>
      </header>

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
            {visibleRecords.map((record) => (
              <button
                className={record.id === selectedRecord.id ? "is-selected" : ""}
                key={record.id}
                onClick={() => selectRecord(record)}
                type="button"
              >
                <strong>{record.protocol}</strong>
                <span>{record.requester.name}</span>
                <small>{record.items.length} item(ns) em posse</small>
              </button>
            ))}
            {!visibleRecords.length && <p className="return-operations__empty">Nenhum item em posse encontrado.</p>}
          </div>
        </aside>

        <div className="return-operations__content">
          <section className="return-operations__dossier" aria-labelledby="dossier-title">
            <div>
              <p className="return-operations__eyebrow">Dossiê do solicitante</p>
              <h2 id="dossier-title">{selectedRecord.requester.name}</h2>
            </div>
            <dl>
              <div><dt>Matrícula</dt><dd>{selectedRecord.requester.registration}</dd></div>
              <div><dt>Curso</dt><dd>{selectedRecord.requester.course}</dd></div>
              <div><dt>Contato</dt><dd>{selectedRecord.requester.contact}</dd></div>
              <div><dt>Retirada</dt><dd>{displayDate(selectedRecord.withdrawnAt)}</dd></div>
            </dl>
            <p><strong>Finalidade:</strong> {selectedRecord.purpose}</p>
          </section>

          <section className="return-operations__checklist" aria-labelledby="checklist-title">
            <div className="return-operations__section-heading">
              <div>
                <p className="return-operations__eyebrow">Conferência por item</p>
                <h2 id="checklist-title">Checklist de recebimento</h2>
              </div>
              <span>{selectedRecord.protocol}</span>
            </div>
            {selectedRecord.items.map((item) => {
              const draft = itemDrafts[item.id];
              return (
                <article className="return-operations__item" key={item.id}>
                  <label className="return-operations__item-check">
                    <input
                      checked={draft?.checked ?? false}
                      onChange={(event) => updateItem(item.id, { checked: event.target.checked })}
                      type="checkbox"
                    />
                    <span>
                      <strong>{item.description}</strong>
                      <small>{item.category} · {item.identifier} · retirada em {displayDate(item.withdrawalAt)}</small>
                    </span>
                  </label>
                  <label>
                    Condição de devolução
                    <select
                      disabled={!draft?.checked}
                      onChange={(event) => updateItem(item.id, { condition: event.target.value as ReturnCondition })}
                      value={draft?.condition ?? ""}
                    >
                      <option value="">Selecione</option>
                      {conditions.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}
                    </select>
                  </label>
                </article>
              );
            })}
          </section>

          <section className="return-operations__homologation" aria-labelledby="homologation-title">
            <div>
              <p className="return-operations__eyebrow">Encerramento demonstrativo</p>
              <h2 id="homologation-title">Termo de homologação</h2>
              <p>Declaro que os itens listados foram conferidos presencialmente. Esta tela apenas simula a baixa da custódia.</p>
            </div>
            <label className="return-operations__date-field" htmlFor="return-date">
              Data e hora da devolução
              <input
                id="return-date"
                min={selectedRecord.withdrawnAt}
                onChange={(event) => { setReturnedAt(event.target.value); setConfirmedPayload(null); }}
                type="datetime-local"
                value={returnedAt}
              />
              {!isAfterWithdrawal && <small className="return-operations__error">A devolução deve ser posterior à retirada.</small>}
            </label>
            <label className="return-operations__consent">
              <input checked={homologated} onChange={(event) => { setHomologated(event.target.checked); setConfirmedPayload(null); }} type="checkbox" />
              Homologo a conferência e a condição informada para cada item.
            </label>
            <button className="return-operations__confirm" disabled={!mayConfirm} onClick={confirmReturn} type="button">
              Confirmar Devolução e Baixar Custódia
            </button>
          </section>

          {confirmedPayload && (
            <aside className="return-operations__success" role="status">
              <strong>Baixa demonstrativa concluída.</strong>
              <span>{selectedRecord.protocol} foi encerrado visualmente em {displayDate(confirmedPayload.returnedAt)}. O callback tipado foi acionado e nenhum dado foi persistido.</span>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}

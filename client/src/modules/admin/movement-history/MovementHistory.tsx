import { useMemo, useState } from "react";

import { movementHistoryMock } from "./movementHistory.mock";
import type { MovementFilters, MovementKind, MovementRecord, MovementStatus } from "./types";
import "./movementHistory.css";

const emptyFilters: MovementFilters = {
  query: "",
  kind: "",
  status: "",
  startDate: "",
  endDate: "",
};

const kindLabels: Record<MovementKind, string> = {
  SOLICITACAO: "Solicitação",
  RETIRADA: "Retirada",
  DEVOLUCAO: "Devolução",
  ATRASO: "Atraso",
  ADMINISTRACAO: "Administração",
};

const statusLabels: Record<MovementStatus, string> = {
  CONCLUIDO: "Concluído",
  PENDENTE: "Pendente",
  ATRASADO: "Atrasado",
  INATIVO: "Inativo",
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );

const toDateInput = (value: Date) => value.toISOString().slice(0, 10);

export function MovementHistory() {
  const [draftFilters, setDraftFilters] = useState<MovementFilters>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<MovementFilters>(emptyFilters);
  const [selectedRecord, setSelectedRecord] = useState<MovementRecord | null>(null);
  const [notice, setNotice] = useState<string>("");

  const results = useMemo(() => {
    const normalizedQuery = appliedFilters.query.trim().toLocaleLowerCase("pt-BR");

    return movementHistoryMock.filter((record) => {
      const searchable = `${record.protocol} ${record.requester} ${record.item}`.toLocaleLowerCase(
        "pt-BR",
      );
      const recordDate = record.occurredAt.slice(0, 10);

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (!appliedFilters.kind || record.kind === appliedFilters.kind) &&
        (!appliedFilters.status || record.status === appliedFilters.status) &&
        (!appliedFilters.startDate || recordDate >= appliedFilters.startDate) &&
        (!appliedFilters.endDate || recordDate <= appliedFilters.endDate)
      );
    });
  }, [appliedFilters]);

  const updateFilter = <Key extends keyof MovementFilters>(key: Key, value: MovementFilters[Key]) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const applyQuickPeriod = (days: number) => {
    const endDate = new Date("2026-10-16T12:00:00");
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (days - 1));
    const filters = { ...draftFilters, startDate: toDateInput(startDate), endDate: toDateInput(endDate) };

    setDraftFilters(filters);
    setAppliedFilters(filters);
    setNotice(`Período dos últimos ${days} dias aplicado.`);
  };

  const handleApply = () => {
    setAppliedFilters(draftFilters);
    setNotice("Filtros aplicados à lista demonstrativa.");
  };

  const handleClear = () => {
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setNotice("Filtros limpos.");
  };

  const showDemonstrativeNotice = (action: string) => {
    setNotice(`${action} é um controle demonstrativo; nenhum arquivo foi gerado.`);
  };

  return (
    <section className="movement-history" aria-labelledby="movement-history-title">
      <header className="movement-history__header">
        <div>
          <p className="movement-history__eyebrow">Administração</p>
          <h1 id="movement-history-title">Histórico de movimentações</h1>
          <p>Consulte os registros demonstrativos de solicitações, retiradas, devoluções e atrasos.</p>
        </div>
        <div className="movement-history__actions" aria-label="Controles demonstrativos">
          <button type="button" onClick={() => showDemonstrativeNotice("Impressão")}>Imprimir</button>
          <button type="button" onClick={() => showDemonstrativeNotice("Exportação")}>Exportar</button>
        </div>
      </header>

      <div className="movement-history__quick-periods" aria-label="Períodos rápidos">
        <span>Períodos rápidos:</span>
        <button type="button" onClick={() => applyQuickPeriod(1)}>Hoje</button>
        <button type="button" onClick={() => applyQuickPeriod(7)}>Últimos 7 dias</button>
        <button type="button" onClick={() => applyQuickPeriod(30)}>Últimos 30 dias</button>
      </div>

      <div className="movement-history__filters" aria-label="Filtros do histórico">
        <label>
          Buscar
          <input
            value={draftFilters.query}
            onChange={(event) => updateFilter("query", event.target.value)}
            placeholder="Protocolo, solicitante ou item"
          />
        </label>
        <label>
          Tipo
          <select value={draftFilters.kind} onChange={(event) => updateFilter("kind", event.target.value as MovementKind | "")}>
            <option value="">Todos</option>
            {Object.entries(kindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          Situação
          <select value={draftFilters.status} onChange={(event) => updateFilter("status", event.target.value as MovementStatus | "")}>
            <option value="">Todas</option>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          De
          <input type="date" value={draftFilters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} />
        </label>
        <label>
          Até
          <input type="date" value={draftFilters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} />
        </label>
        <div className="movement-history__filter-actions">
          <button type="button" onClick={handleApply}>Aplicar filtros</button>
          <button type="button" onClick={handleClear}>Limpar</button>
        </div>
      </div>

      {notice && <p className="movement-history__notice" role="status">{notice}</p>}

      <div className="movement-history__results" aria-live="polite">
        <div className="movement-history__result-summary"><strong>{results.length}</strong> ocorrência(s) encontrada(s)</div>
        <div className="movement-history__table-wrap">
          <table>
            <thead>
              <tr><th>Data e hora</th><th>Protocolo</th><th>Ocorrência</th><th>Item</th><th>Situação</th><th><span className="sr-only">Ações</span></th></tr>
            </thead>
            <tbody>
              {results.map((record) => (
                <tr key={record.id}>
                  <td>{formatDateTime(record.occurredAt)}</td>
                  <td>{record.protocol}</td>
                  <td>{kindLabels[record.kind]}<small>{record.requester}</small></td>
                  <td>{record.item}</td>
                  <td><span className={`movement-history__status movement-history__status--${record.status.toLocaleLowerCase("pt-BR")}`}>{statusLabels[record.status]}</span></td>
                  <td><button type="button" onClick={() => setSelectedRecord(record)}>Abrir dossiê</button></td>
                </tr>
              ))}
              {!results.length && <tr><td colSpan={6} className="movement-history__empty">Nenhuma ocorrência corresponde aos filtros aplicados.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRecord && (
        <aside className="movement-history__dossier" aria-labelledby="movement-dossier-title">
          <div className="movement-history__dossier-heading">
            <div><p className="movement-history__eyebrow">Dossiê demonstrativo</p><h2 id="movement-dossier-title">{selectedRecord.protocol}</h2></div>
            <button type="button" onClick={() => setSelectedRecord(null)} aria-label="Fechar dossiê">Fechar</button>
          </div>
          <dl>
            <div><dt>Ocorrência</dt><dd>{kindLabels[selectedRecord.kind]}</dd></div>
            <div><dt>Situação</dt><dd>{statusLabels[selectedRecord.status]}</dd></div>
            <div><dt>Registrada em</dt><dd>{formatDateTime(selectedRecord.occurredAt)}</dd></div>
            <div><dt>Solicitante</dt><dd>{selectedRecord.requester}</dd></div>
            <div><dt>Item</dt><dd>{selectedRecord.item}</dd></div>
            <div><dt>Responsável</dt><dd>{selectedRecord.responsible}</dd></div>
            <div><dt>Detalhes</dt><dd>{selectedRecord.details}</dd></div>
          </dl>
          <p>Este dossiê utiliza apenas dados mock locais e não altera o histórico.</p>
        </aside>
      )}
    </section>
  );
}

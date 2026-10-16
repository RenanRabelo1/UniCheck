import { useMemo, useState } from "react";

import { pendingRequestsMock, pendingRequestsReferenceDate } from "./pendingRequests.mock";
import type {
  PendingRequestDemoState,
  PendingRequestPeriod,
  PendingRequestResource,
  PendingRequestsScreenProps,
} from "./types";
import "./PendingRequestsScreen.css";

const pageSize = 4;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(`${date}T12:00:00`),
  );

const toTimestamp = (date: string) => new Date(`${date}T12:00:00`).getTime();

const periodStartBy = (period: PendingRequestPeriod) => {
  const reference = toTimestamp(pendingRequestsReferenceDate);
  const day = 24 * 60 * 60 * 1000;

  if (period === "today") return reference;
  if (period === "last-7-days") return reference - 6 * day;
  if (period === "month") return toTimestamp("2026-10-01");
  return undefined;
};

export function PendingRequestsScreen({ onAnalyzeRequest }: PendingRequestsScreenProps) {
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<PendingRequestPeriod>("last-7-days");
  const [resource, setResource] = useState<"all" | PendingRequestResource>("all");
  const [priority, setPriority] = useState<"all" | "Normal" | "Alta">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [demoState, setDemoState] = useState<PendingRequestDemoState>("normal");

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
    const periodStart = periodStartBy(period);
    const customStart = startDate ? toTimestamp(startDate) : undefined;
    const customEnd = endDate ? toTimestamp(endDate) : undefined;

    return pendingRequestsMock.filter((request) => {
      const requestedAt = toTimestamp(request.requestedAt);
      const matchesQuery =
        !normalizedQuery ||
        request.protocol.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
        request.requesterName.toLocaleLowerCase("pt-BR").includes(normalizedQuery) ||
        request.resourceSummary.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
      const matchesPeriod =
        period === "custom"
          ? (!customStart || requestedAt >= customStart) && (!customEnd || requestedAt <= customEnd)
          : !periodStart || requestedAt >= periodStart;

      return (
        matchesQuery &&
        matchesPeriod &&
        (resource === "all" || request.resourceType === resource) &&
        (priority === "all" || request.priority === priority)
      );
    });
  }, [endDate, period, priority, query, resource, startDate]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeFilters = [query, resource !== "all", priority !== "all", period !== "last-7-days"].filter(Boolean).length;

  const resetFilters = () => {
    setQuery("");
    setPeriod("last-7-days");
    setResource("all");
    setPriority("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const selectPeriod = (value: PendingRequestPeriod) => {
    setPeriod(value);
    setPage(1);
  };

  return (
    <main className="pending-requests" aria-labelledby="pending-requests-title">
      <nav className="pending-requests__breadcrumb" aria-label="Navegação administrativa">
        Administração <span aria-hidden="true">/</span> Solicitações <span aria-hidden="true">/</span>{" "}
        <strong>Pendentes</strong>
      </nav>

      <header className="pending-requests__header">
        <div>
          <p className="pending-requests__eyebrow">Coordenação CCT</p>
          <h1 id="pending-requests-title">Solicitações pendentes</h1>
          <p>Localize os pedidos aguardando parecer e inicie a análise visual.</p>
        </div>
        <label className="pending-requests__demo-control">
          Estado demonstrativo
          <select value={demoState} onChange={(event) => setDemoState(event.target.value as PendingRequestDemoState)}>
            <option value="normal">Lista</option>
            <option value="loading">Carregando</option>
            <option value="empty">Vazio</option>
            <option value="error">Erro</option>
          </select>
        </label>
      </header>

      <section className="pending-requests__filters" aria-label="Filtros de solicitações">
        <label className="pending-requests__search">
          Buscar solicitação
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Protocolo, solicitante ou item"
          />
        </label>

        <fieldset className="pending-requests__period">
          <legend>Período</legend>
          <div className="pending-requests__period-options">
            {[
              ["today", "Hoje"],
              ["last-7-days", "Últimos 7 dias"],
              ["month", "Este mês"],
              ["custom", "Personalizado"],
            ].map(([value, label]) => (
              <button
                className={period === value ? "is-selected" : undefined}
                key={value}
                onClick={() => selectPeriod(value as PendingRequestPeriod)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="pending-requests__custom-dates">
              <label>
                De
                <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>
              <label>
                Até
                <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </label>
            </div>
          )}
        </fieldset>

        <label>
          Recurso
          <select value={resource} onChange={(event) => { setResource(event.target.value as "all" | PendingRequestResource); setPage(1); }}>
            <option value="all">Todos</option>
            <option value="MATERIAL">Materiais</option>
            <option value="CHAVE">Chaves</option>
          </select>
        </label>
        <label>
          Prioridade
          <select value={priority} onChange={(event) => { setPriority(event.target.value as "all" | "Normal" | "Alta"); setPage(1); }}>
            <option value="all">Todas</option>
            <option value="Alta">Alta</option>
            <option value="Normal">Normal</option>
          </select>
        </label>
        <button className="pending-requests__clear" onClick={resetFilters} type="button">
          Limpar filtros
        </button>
      </section>

      <section className="pending-requests__results" aria-live="polite">
        <div className="pending-requests__results-heading">
          <div>
            <h2>Pedidos aguardando parecer</h2>
            <p>
              {filteredRequests.length} solicitação{filteredRequests.length === 1 ? "" : "ões"} encontrada
              {filteredRequests.length === 1 ? "" : "s"}.
            </p>
          </div>
          {activeFilters > 0 && <span className="pending-requests__filtered">{activeFilters} filtro(s) aplicado(s)</span>}
        </div>

        {demoState === "loading" && <LoadingState />}
        {demoState === "error" && <ErrorState onRetry={() => setDemoState("normal")} />}
        {demoState === "empty" && <EmptyState onClear={resetFilters} />}
        {demoState === "normal" && filteredRequests.length === 0 && <EmptyState onClear={resetFilters} filtered />}
        {demoState === "normal" && filteredRequests.length > 0 && (
          <>
            <div className="pending-requests__list" role="list">
              {visibleRequests.map((request) => (
                <article className="pending-request-card" key={request.id} role="listitem">
                  <div className="pending-request-card__identity">
                    <span className="pending-request-card__protocol">{request.protocol}</span>
                    <span className={`pending-request-card__priority pending-request-card__priority--${request.priority.toLocaleLowerCase("pt-BR")}`}>
                      Prioridade {request.priority.toLocaleLowerCase("pt-BR")}
                    </span>
                  </div>
                  <h3>{request.requesterName}</h3>
                  <p>{request.requesterRole} · {request.resourceType === "MATERIAL" ? "Material" : "Chave"}</p>
                  <dl>
                    <div><dt>Solicitado</dt><dd>{request.resourceSummary}</dd></div>
                    <div><dt>Recebido em</dt><dd>{formatDate(request.requestedAt)}</dd></div>
                    <div><dt>Uso previsto</dt><dd>{formatDate(request.requestedFor)}</dd></div>
                  </dl>
                  <button type="button" onClick={() => onAnalyzeRequest?.(request.id)}>
                    Analisar solicitação
                  </button>
                </article>
              ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </section>
    </main>
  );
}

function LoadingState() {
  return <div className="pending-requests__state" role="status"><span className="pending-requests__spinner" aria-hidden="true" /> Carregando solicitações pendentes…</div>;
}

function EmptyState({ filtered = false, onClear }: { filtered?: boolean; onClear: () => void }) {
  return (
    <div className="pending-requests__state">
      <h3>{filtered ? "Nenhuma solicitação encontrada" : "Não há solicitações pendentes"}</h3>
      <p>{filtered ? "Tente ajustar a busca ou os filtros selecionados." : "Quando houver novos pedidos aguardando parecer, eles aparecerão aqui."}</p>
      {filtered && <button onClick={onClear} type="button">Limpar filtros</button>}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="pending-requests__state pending-requests__state--error" role="alert">
      <h3>Não foi possível exibir as solicitações</h3>
      <p>Esta é uma simulação local de erro. Tente carregar a lista novamente.</p>
      <button onClick={onRetry} type="button">Tentar novamente</button>
    </div>
  );
}

function Pagination({ currentPage, totalPages, onChange }: { currentPage: number; totalPages: number; onChange: (page: number) => void }) {
  return (
    <nav className="pending-requests__pagination" aria-label="Paginação de solicitações">
      <button disabled={currentPage === 1} onClick={() => onChange(currentPage - 1)} type="button">Anterior</button>
      <span>Página {currentPage} de {totalPages}</span>
      <button disabled={currentPage === totalPages} onClick={() => onChange(currentPage + 1)} type="button">Próxima</button>
    </nav>
  );
}

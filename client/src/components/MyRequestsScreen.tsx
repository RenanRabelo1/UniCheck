import { listRequests } from "../services/requests";
import { isApiMode } from "../services/api";
import { useRequestData } from "../modules/solicitacoes/useRequestData";
import { useMemo, useState, useCallback } from "react";
import type { DashboardSession } from "../modules/dashboard/dashboard.types";
import {
  myRequestsMock,
  type MyRequest,
  type MyRequestStatus,
} from "./MyRequestsScreen.mock";
import "./MyRequestsScreen.css";

export type MyRequestsScreenProps = {
  session: DashboardSession;
  onBack: () => void;
  onNewRequest: () => void;
  onOpenRequest: (request: MyRequest) => void;
};

type StatusFilter = "all" | MyRequestStatus;
type PeriodFilter = string;

const statusDetails: Record<
  MyRequestStatus,
  { label: string; symbol: string }
> = {
  "in-possession": { label: "Em posse", symbol: "●" },
  approved: { label: "Aprovada", symbol: "✓" },
  pending: { label: "Pendente", symbol: "◷" },
  returned: { label: "Devolvida", symbol: "↩" },
  rejected: { label: "Recusada", symbol: "×" },
};

const filters: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "in-possession", label: "Em posse" },
  { value: "approved", label: "Aprovadas" },
  { value: "pending", label: "Pendentes" },
  { value: "returned", label: "Devolvidas" },
  { value: "rejected", label: "Recusadas" },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

export function MyRequestsScreen({
  session,
  onBack,
  onNewRequest,
  onOpenRequest,
}: MyRequestsScreenProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");

  const load = useCallback(
    async (signal: AbortSignal) =>
      isApiMode() ? listRequests(signal) : myRequestsMock,
    [],
  );
  const { data, error, loading, retry } = useRequestData(load);
  const requests = useMemo(() => data ?? [], [data]);
  const periods = [...new Set(requests.map((request) => request.period))]
    .sort()
    .reverse();

  const statusCounts = useMemo(
    () =>
      requests.reduce<Record<MyRequestStatus, number>>(
        (counts, request) => ({
          ...counts,
          [request.status]: counts[request.status] + 1,
        }),
        {
          "in-possession": 0,
          approved: 0,
          pending: 0,
          returned: 0,
          rejected: 0,
        },
      ),
    [requests],
  );

  const visibleRequests = useMemo(() => {
    const normalizedQuery = normalize(query.trim());

    return requests.filter((request) => {
      const searchableText = normalize(
        [
          request.protocol,
          request.item,
          request.secondaryItem,
          request.destination,
          statusDetails[request.status].label,
        ]
          .filter(Boolean)
          .join(" "),
      );

      return (
        (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
        (statusFilter === "all" || request.status === statusFilter) &&
        (periodFilter === "all" || request.period === periodFilter)
      );
    });
  }, [requests, periodFilter, query, statusFilter]);

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setPeriodFilter("all");
  };

  if (loading || error)
    return (
      <main className="dashboard-feedback">
        <button onClick={onBack}>Voltar para início</button>
        {loading ? (
          <p role="status">Carregando solicitações...</p>
        ) : (
          <>
            <p role="alert">{error}</p>
            <button onClick={retry}>Tentar novamente</button>
          </>
        )}
      </main>
    );

  return (
    <main className="my-requests-page">
      <header className="my-requests-header">
        <div className="my-requests-header__content">
          <button className="my-requests-brand" type="button" onClick={onBack}>
            <img src="/brand/unifor.svg" alt="Unifor" />
            <span aria-hidden="true" />
            <span>
              <strong>Sistema CCT</strong>
              <small>Controle de Empréstimos · Bloco J-02</small>
            </span>
          </button>

          <nav className="my-requests-nav" aria-label="Navegação principal">
            <button type="button" onClick={onBack}>
              Início
            </button>
            <button type="button" onClick={onNewRequest}>
              Nova solicitação
            </button>
            <button type="button" className="active" aria-current="page">
              Minhas solicitações
            </button>
          </nav>

          <div className="my-requests-profile">
            <span className="my-requests-profile__copy">
              <strong>{session.name}</strong>
              <small>{session.roleLabel} · Bloco J-02</small>
            </span>
            <span className="my-requests-profile__avatar" aria-hidden="true">
              {session.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      <section className="my-requests-content">
        <aside
          className="my-requests-notice"
          aria-label="Atendimento da secretaria"
        >
          <span className="my-requests-notice__icon" aria-hidden="true">
            ✓
          </span>
          <p>
            <strong>Secretaria Acadêmica CCT · Bloco J-02:</strong> atendimento
            presencial de segunda a sexta, das 07h30 às 21h00 · Ramal{" "}
            <b>3477-3120</b>
          </p>
          <span className="my-requests-open">
            <i /> Guichê J-02
          </span>
        </aside>

        <div className="my-requests-title-row">
          <div>
            <span className="my-requests-eyebrow">
              ▣ Gestão de recursos e chaves
            </span>
            <h1>Minhas solicitações</h1>
            <button type="button" onClick={retry}>
              Atualizar solicitações
            </button>
            <p>
              Acompanhe o andamento das suas solicitações de materiais e chaves
              laboratoriais.
            </p>
          </div>
          <button
            className="my-requests-new"
            type="button"
            onClick={onNewRequest}
          >
            <span aria-hidden="true">＋</span> Nova solicitação
          </button>
        </div>

        <section
          className="my-requests-controls"
          aria-label="Filtros de solicitações"
        >
          <div className="my-requests-controls__top">
            <label className="my-requests-search">
              <span className="sr-only">Buscar solicitação</span>
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por protocolo, item ou sala..."
              />
            </label>

            <label className="my-requests-period">
              <span>Período</span>
              <select
                value={periodFilter}
                onChange={(event) =>
                  setPeriodFilter(event.target.value as PeriodFilter)
                }
              >
                {periods.map((period) => (
                  <option key={period} value={period}>
                    Semestre {period}
                  </option>
                ))}
                <option value="all">Todo o histórico</option>
              </select>
            </label>
          </div>

          <div
            className="my-requests-status-filters"
            aria-label="Filtrar por situação"
          >
            <span>Filtrar:</span>
            {filters.map((filter) => {
              const count =
                filter.value === "all"
                  ? requests.length
                  : statusCounts[filter.value];

              return (
                <button
                  type="button"
                  key={filter.value}
                  className={statusFilter === filter.value ? "active" : ""}
                  aria-pressed={statusFilter === filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label} <b>{count}</b>
                </button>
              );
            })}
          </div>
        </section>

        {visibleRequests.length > 0 ? (
          <>
            <div className="my-requests-table-wrap">
              <table className="my-requests-table">
                <thead>
                  <tr>
                    <th>Protocolo / Data</th>
                    <th>Itens solicitados</th>
                    <th>Destino e horário</th>
                    <th>Situação / Instrução</th>
                    <th>
                      <span className="sr-only">Ação</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <strong className="my-requests-protocol">
                          #{request.protocol}
                        </strong>
                        <small>{request.requestedAt}</small>
                      </td>
                      <td>
                        <strong>{request.item}</strong>
                        {request.secondaryItem && (
                          <small>{request.secondaryItem}</small>
                        )}
                      </td>
                      <td>
                        <strong>{request.destination}</strong>
                        <small>◷ {request.schedule}</small>
                      </td>
                      <td>
                        <span
                          className={`my-requests-status ${request.status}`}
                        >
                          <i aria-hidden="true">
                            {statusDetails[request.status].symbol}
                          </i>
                          {statusDetails[request.status].label}
                        </span>
                        <small>{request.instruction}</small>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => onOpenRequest(request)}
                        >
                          Ver detalhes <span aria-hidden="true">›</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="my-requests-cards">
              {visibleRequests.map((request) => (
                <article
                  className={`my-request-card ${request.status}`}
                  key={request.id}
                >
                  <header>
                    <span>
                      <strong>#{request.protocol}</strong>
                      <small>{request.requestedAt}</small>
                    </span>
                    <span className={`my-requests-status ${request.status}`}>
                      <i aria-hidden="true">
                        {statusDetails[request.status].symbol}
                      </i>
                      {statusDetails[request.status].label}
                    </span>
                  </header>
                  <h2>{request.item}</h2>
                  {request.secondaryItem && <p>{request.secondaryItem}</p>}
                  <dl>
                    <div>
                      <dt>Destino</dt>
                      <dd>{request.destination}</dd>
                    </div>
                    <div>
                      <dt>Horário</dt>
                      <dd>{request.schedule}</dd>
                    </div>
                  </dl>
                  <p className="my-request-card__instruction">
                    ⓘ {request.instruction}
                  </p>
                  <button type="button" onClick={() => onOpenRequest(request)}>
                    Ver detalhes <span aria-hidden="true">›</span>
                  </button>
                </article>
              ))}
            </div>
          </>
        ) : (
          <section className="my-requests-empty" role="status">
            <span aria-hidden="true">⌕</span>
            <h2>Nenhuma solicitação encontrada</h2>
            <p>
              {requests.length
                ? "Não encontramos solicitações com os filtros escolhidos."
                : "Você ainda não possui solicitações registradas."}
            </p>
            <button type="button" onClick={clearFilters}>
              Limpar filtros
            </button>
          </section>
        )}

        <section
          className="my-requests-help"
          aria-label="Orientações importantes"
        >
          <article>
            <span>✓</span>
            <div>
              <h2>Responsabilidade pessoal</h2>
              <p>Materiais retirados são de uso restrito ao solicitante.</p>
            </div>
          </article>
          <article>
            <span>◷</span>
            <div>
              <h2>Horário limite</h2>
              <p>Respeite o prazo de devolução indicado nos detalhes.</p>
            </div>
          </article>
          <article>
            <span>?</span>
            <div>
              <h2>Precisa de suporte?</h2>
              <p>Procure o guichê J-02 ou ligue para o ramal 3477-3120.</p>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}

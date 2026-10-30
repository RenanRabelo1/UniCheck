import { formatRequestDate } from "./format";
import { useState } from "react";
import { listPendingRequests } from "../../../services/adminRequests";
import { useRequestData } from "../../solicitacoes/useRequestData";
import "../pending-requests/PendingRequestsScreen.css";
import "./requestsApi.css";

export function PendingRequestsApi({
  onAnalyzeRequest,
}: {
  onAnalyzeRequest: (id: string) => void;
}) {
  const { data, loading, error, retry } = useRequestData(listPendingRequests);
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [resource, setResource] = useState("all");
  const [page, setPage] = useState(1);
  const search = query.trim().toLocaleLowerCase("pt-BR");
  const requests = (data ?? []).filter(
    (request) =>
      request.items.some(
        (item) =>
          item.status === "PENDENTE" &&
          (resource === "all" || item.type === resource),
      ) &&
      (!date || request.date === date) &&
      [
        request.protocol,
        request.requester?.name,
        request.requester?.registration,
        ...request.items.map((item) => item.name),
      ].some((text) => text?.toLocaleLowerCase("pt-BR").includes(search)),
  );
  const pages = Math.max(1, Math.ceil(requests.length / 8));
  const current = Math.min(page, pages);
  function clearFilters() {
    setQuery("");
    setDate("");
    setResource("all");
    setPage(1);
  }
  return (
    <main
      className="pending-requests admin-requests-api"
      aria-labelledby="pending-title"
    >
      <header className="pending-requests__header">
        <div>
          <p className="pending-requests__eyebrow">Coordenação CCT</p>
          <h1 id="pending-title">Solicitações pendentes</h1>
          <p>Consulte os pedidos aguardando parecer e analise cada item.</p>
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
      <section
        className="pending-requests__filters"
        aria-label="Filtros de solicitações"
      >
        <label className="pending-requests__search">
          Buscar solicitação
          <input
            value={query}
            placeholder="Protocolo, solicitante, matrícula ou item"
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          Data de utilização
          <input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          Recurso pendente
          <select
            value={resource}
            onChange={(event) => {
              setResource(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">Todos</option>
            <option value="material">Materiais</option>
            <option value="key">Chaves</option>
          </select>
        </label>
        <button
          className="pending-requests__clear"
          type="button"
          onClick={clearFilters}
        >
          Limpar filtros
        </button>
      </section>
      {loading && (
        <p role="status" className="pending-requests__state">
          Carregando solicitações…
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="pending-requests__state pending-requests__state--error"
        >
          <p>{error}</p>
          <button type="button" onClick={retry}>
            Tentar novamente
          </button>
        </div>
      )}
      {!loading && !error && (
        <section
          className="pending-requests__results"
          aria-label="Pedidos aguardando parecer"
        >
          <div className="pending-requests__results-heading">
            <h2>Pedidos aguardando parecer</h2>
            <p role="status">{requests.length} pedido(s) encontrado(s)</p>
          </div>
          {requests.length === 0 && (
            <div className="pending-requests__state">
              <h3>
                {data?.length
                  ? "Nenhuma solicitação encontrada com esses filtros"
                  : "Não há solicitações pendentes"}
              </h3>
              <p>Use Atualizar para consultar novos pedidos.</p>
            </div>
          )}
          <div className="pending-requests__list">
            {requests.slice((current - 1) * 8, current * 8).map((request) => (
              <article className="pending-request-card" key={request.id}>
                <span className="pending-request-card__protocol">
                  {request.protocol}
                </span>
                <h3>
                  {request.requester?.name ?? "Solicitante não disponível"}
                </h3>
                <p>{request.requester?.roleLabel}</p>
                <dl>
                  <div>
                    <dt>Itens</dt>
                    <dd>
                      {request.items
                        .map(
                          (item) =>
                            `${item.name} (${item.quantity}) — ${item.statusLabel}`,
                        )
                        .join(" · ")}
                    </dd>
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
                <button
                  type="button"
                  aria-label={`Analisar ${request.protocol}`}
                  onClick={() => onAnalyzeRequest(request.id)}
                >
                  Analisar solicitação
                </button>
              </article>
            ))}
          </div>
          {requests.length > 0 && (
            <nav
              className="pending-requests__pagination"
              aria-label="Paginação de solicitações"
            >
              <button
                type="button"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
              >
                Anterior
              </button>
              <span>
                Página {current} de {pages}
              </span>
              <button
                type="button"
                disabled={current === pages}
                onClick={() => setPage(current + 1)}
              >
                Próxima
              </button>
            </nav>
          )}
        </section>
      )}
    </main>
  );
}

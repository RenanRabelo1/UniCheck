import { useState, type FormEvent } from "react";
import {
  adminMetricsMock,
  adminMovementsMock,
  adminQuickActionsMock,
} from "./AdminDashboard.mock";
import type {
  AdminAction,
  AdminIconName,
  AdminSession,
} from "./AdminDashboard.types";
import "./AdminDashboard.css";

export type AdminDashboardProps = {
  session: AdminSession;
  onLogout: () => void;
  onAction?: (action: AdminAction) => void;
  onSearch?: (query: string) => void;
  onViewRequest?: (requestId: string) => void;
};

const navigation: {
  label: string;
  action?: AdminAction;
  icon: AdminIconName;
  active?: boolean;
}[] = [
  { label: "Painel administrativo", icon: "dashboard", active: true },
  { label: "Solicitações", icon: "pending", action: "requests" },
  { label: "Retiradas e devoluções", icon: "swap", action: "operations" },
  { label: "Materiais e chaves", icon: "inventory", action: "inventory" },
  { label: "Usuários autorizados", icon: "badge", action: "authorized-users" },
  { label: "Relatórios", icon: "analytics", action: "reports" },
];

const iconPaths: Record<AdminIconName, React.ReactNode> = {
  alert: (
    <>
      <path d="M12 4 3.5 19h17L12 4Z" />
      <path d="M12 9v4m0 3h.01" />
    </>
  ),
  analytics: (
    <>
      <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />
    </>
  ),
  arrow: (
    <>
      <path d="M4 12h15m-5-5 5 5-5 5" />
    </>
  ),
  badge: (
    <>
      <rect x="4" y="6" width="16" height="13" rx="2" />
      <path d="M9 6V4h6v2M8 11h.01M11 11h5m-8 4h8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4m10-4v4M3 10h18" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16.5 9" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  inventory: (
    <>
      <path d="m4 7 8-4 8 4-8 4-8-4Z" />
      <path d="M4 7v10l8 4 8-4V7M12 11v10" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8m-3 3 2 2m-5 1 2 2" />
    </>
  ),
  logout: (
    <>
      <path d="M9 4H4v16h5m1-8h11m-4-4 4 4-4 4" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  pending: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M19 12a7 7 0 1 0-2 5" />
    </>
  ),
  report: (
    <>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M14 3v4h4M9 12h6m-6 4h6" />
    </>
  ),
  return: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M19 12a7 7 0 1 0-2 5" />
    </>
  ),
  scanner: (
    <>
      <path d="M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3M4 16v3a1 1 0 0 0 1 1h3m8 0h3a1 1 0 0 0 1-1v-3" />
      <path d="M7 12h10" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4 4" />
    </>
  ),
  swap: (
    <>
      <path d="M4 7h14l-3-3m3 3-3 3M20 17H6l3 3m-3-3 3-3" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
};

function Icon({ name, size = 20 }: { name: AdminIconName; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

export function AdminDashboard({
  session,
  onLogout,
  onAction,
  onSearch,
  onViewRequest,
}: AdminDashboardProps) {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const location = session.location ?? "Secretaria CCT J-02";

  function runAction(action?: AdminAction) {
    setMenuOpen(false);
    if (action) onAction?.(action);
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (normalizedQuery) onSearch?.(normalizedQuery);
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <button
          className="admin-menu-button"
          type="button"
          aria-label="Abrir navegação"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name="menu" />
        </button>
        <div className="admin-brand">
          <img src="/brand/unifor.svg" alt="Unifor" />
          <span aria-hidden="true" />
          <div>
            <strong>Sistema CCT</strong>
            <small>Controle de Empréstimos • Bloco J-02</small>
          </div>
        </div>
        <div className="admin-header-actions">
          <span className="admin-service-status">
            <i /> Atendimento presencial ativo
          </span>
          <div className="admin-profile">
            <span className="admin-avatar">
              <Icon name="user" size={17} />
            </span>
            <div>
              <strong>{session.name}</strong>
              <small>{location}</small>
            </div>
          </div>
          <button
            className="admin-icon-button"
            type="button"
            onClick={onLogout}
            aria-label="Encerrar sessão"
            title="Encerrar sessão"
          >
            <Icon name="logout" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <button
          className="admin-sidebar-backdrop"
          type="button"
          aria-label="Fechar navegação"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`admin-sidebar${menuOpen ? " is-open" : ""}`}>
        <div>
          <p className="admin-nav-label">Navegação administrativa</p>
          <nav aria-label="Navegação administrativa">
            {navigation.map((item) => (
              <button
                key={item.label}
                type="button"
                className={item.active ? "active" : ""}
                aria-current={item.active ? "page" : undefined}
                onClick={() => runAction(item.action)}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="admin-contact">
          <strong>ⓘ Secretaria Bloco J-02</strong>
          <span>Ramal: 3477-3120</span>
          <span>Atendimento: 07h30 às 21h00</span>
        </div>
      </aside>

      <main className="admin-main">
        <section className="admin-page-heading">
          <div>
            <p>
              Coordenação do Centro de Tecnologia <i /> <span>Bloco J-02</span>
            </p>
            <h1>Painel administrativo</h1>
            <span>
              Acompanhe as movimentações e as pendências da secretaria em tempo
              real.
            </span>
          </div>
          <div className="admin-date">
            <Icon name="calendar" />
            <div>
              <strong>Quarta-feira, 24 de setembro de 2026</strong>
              <small>Turno diurno (07h30 — 21h00)</small>
            </div>
            <button
              type="button"
              aria-label="Atualizar dados"
              title="Atualizar dados"
              onClick={() => runAction("refresh")}
            >
              <Icon name="refresh" />
            </button>
          </div>
        </section>

        <form className="admin-scanner" role="search" onSubmit={submitSearch}>
          <span className="admin-scanner-icon">
            <Icon name="scanner" size={23} />
          </span>
          <label htmlFor="admin-counter-search" className="sr-only">
            Buscar matrícula, patrimônio, protocolo ou chave
          </label>
          <div className="admin-search-field">
            <Icon name="search" size={18} />
            <input
              id="admin-counter-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Leitor de crachá ou patrimônio: digite a matrícula, protocolo ou código da chave..."
            />
          </div>
          <span className="admin-reader-label">Leitor USB/Bluetooth:</span>
          <span className="admin-reader-ready">
            <i /> Pronto para leitura
          </span>
        </form>

        <section className="admin-metrics" aria-label="Resumo operacional">
          {adminMetricsMock.map((metric) => (
            <article
              className={`admin-metric tone-${metric.tone}`}
              key={metric.id}
            >
              <div className="admin-metric-title">
                <span>{metric.label}</span>
                <b>
                  <Icon name={metric.icon} size={22} />
                </b>
              </div>
              <div className="admin-metric-value">
                <strong>{metric.value}</strong>
                <small>{metric.badge}</small>
              </div>
              <p>{metric.description}</p>
              <button
                type="button"
                onClick={() =>
                  runAction(
                    metric.id === "pending"
                      ? "review-requests"
                      : metric.id === "returns"
                        ? "register-return"
                        : "operations",
                  )
                }
              >
                {metric.footer}
                <Icon name="chevron" size={16} />
              </button>
            </article>
          ))}
        </section>

        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <h2>Ações rápidas</h2>
              <p>
                Acessos diretos para as rotinas operacionais do balcão e
                atendimento presencial.
              </p>
            </div>
            <span>6 fluxos ativos</span>
          </div>
          <div className="admin-quick-grid">
            {adminQuickActionsMock.map((action) => (
              <button
                type="button"
                className="admin-quick-action"
                key={action.id}
                onClick={() => runAction(action.id)}
              >
                <span className="admin-quick-icon">
                  <Icon name={action.icon} size={24} />
                </span>
                <span>
                  <strong>{action.label}</strong>
                  <small>{action.description}</small>
                </span>
                <Icon name="chevron" />
              </button>
            ))}
          </div>
        </section>

        <section className="admin-operational">
          <div className="admin-recent-card">
            <div className="admin-table-heading">
              <div>
                <h2>Solicitações recentes</h2>
                <p>
                  Últimas movimentações registradas no sistema da secretaria.
                </p>
              </div>
              <button type="button" onClick={() => runAction("requests")}>
                Ver todas
              </button>
            </div>
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Solicitante</th>
                    <th>Recurso / item</th>
                    <th>Horário</th>
                    <th>Situação</th>
                    <th>
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {adminMovementsMock.map((movement) => (
                    <tr key={movement.id}>
                      <td data-label="Código">
                        <strong className="admin-code">{movement.id}</strong>
                      </td>
                      <td data-label="Solicitante">
                        <strong>{movement.requester}</strong>
                        <small>{movement.requesterRole}</small>
                      </td>
                      <td data-label="Recurso / item">{movement.item}</td>
                      <td data-label="Horário">
                        <strong>{movement.date}</strong>
                        <small>{movement.time}</small>
                      </td>
                      <td data-label="Situação">
                        <span
                          className={`admin-status status-${movement.status.toLowerCase().replace(" ", "-")}`}
                        >
                          {movement.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => onViewRequest?.(movement.id)}
                        >
                          Detalhes <Icon name="chevron" size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="admin-table-note">
              Exibindo 4 de 12 solicitações ativas no turno atual
            </p>
          </div>

          <aside className="admin-side-stack">
            <article className="admin-occupancy">
              <div className="admin-side-title">
                <h2>Ocupação do Bloco J</h2>
                <i />
              </div>
              <div
                className="admin-gauge"
                role="img"
                aria-label="72 por cento das salas com chave ativa"
              >
                <div>
                  <strong>72%</strong>
                  <span>Salas com chave ativa</span>
                </div>
              </div>
              <dl>
                <div>
                  <dt>Chaves de laboratório</dt>
                  <dd>18 / 25 em uso</dd>
                </div>
                <div>
                  <dt>Projetores CCT</dt>
                  <dd>6 / 10 em uso</dd>
                </div>
                <div>
                  <dt>Adaptadores HDMI/USB-C</dt>
                  <dd>12 / 12 (Esgotado)</dd>
                </div>
              </dl>
            </article>
            <article className="admin-protocol">
              <strong>
                <Icon name="check" size={19} /> Protocolo de balcão
              </strong>
              <p>
                Toda entrega física deve ser acompanhada da conferência visual
                da foto institucional no crachá do solicitante.
              </p>
              <span>Responsável: {session.name}</span>
              <b>Guichê 01</b>
            </article>
          </aside>
        </section>
      </main>
    </div>
  );
}

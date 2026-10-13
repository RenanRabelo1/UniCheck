import "./RequestDetailsScreen.css";

export type RequestItemStatus =
  "PENDENTE" | "APROVADO" | "RECUSADO" | "RETIRADO" | "DEVOLVIDO";

export type RequestItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  status: RequestItemStatus;
  code?: string;
  rejectionReason?: string;
  pickup?: {
    date: string;
    attendant: string;
  };
  return?: {
    date?: string;
    dueDate: string;
    attendant?: string;
    condition?: string;
  };
};

export type RequestTimelineEntry = {
  id: string;
  date: string;
  title: string;
  description: string;
  isNextStep?: boolean;
};

export type RequestDetails = {
  id: string;
  protocol: string;
  statusLabel: string;
  requester: {
    name: string;
    role: string;
    registration: string;
  };
  purpose: string;
  location: string;
  requestedAt: string;
  period: string;
  notes?: string;
  items: RequestItem[];
  timeline: RequestTimelineEntry[];
};

type RequestDetailsScreenProps = {
  request?: RequestDetails;
  onBack: () => void;
};

const defaultRequest: RequestDetails = {
  id: "148",
  protocol: "CCT-2026-0148",
  statusLabel: "Em andamento · Parcialmente retirado",
  requester: {
    name: "Carlos Eduardo",
    role: "Professor",
    registration: "123456",
  },
  purpose: "Aula prática de Sistemas Multimídia",
  location: "Laboratório J-02",
  requestedAt: "24/09/2026 às 09:15",
  period: "24/09/2026 · 07:00 às 21:00",
  notes: "Utilização dos equipamentos durante a aula prática da turma N01.",
  items: [
    {
      id: "key-j02",
      name: "Chave da Sala J-02",
      description: "Chave primária de acesso ao laboratório multimídia",
      quantity: 1,
      code: "CHV-J02-A",
      status: "RETIRADO",
      pickup: {
        date: "24/09/2026 às 07:25",
        attendant: "Marcos Silva",
      },
      return: { dueDate: "24/09/2026 às 21:00" },
    },
    {
      id: "projector-24810",
      name: "Projetor Epson WXGA Multimídia",
      description: "Kit 04 · Equipamento de projeção em alta definição",
      quantity: 1,
      code: "Patr. 24810",
      status: "APROVADO",
      return: { dueDate: "24/09/2026 às 21:00" },
    },
    {
      id: "hdmi-09",
      name: "Cabo HDMI de Alta Velocidade",
      description: "Acessório de conectividade AV · 2 metros",
      quantity: 1,
      code: "AC-CAB-09",
      status: "RECUSADO",
      rejectionReason:
        "Item indisponível no horário solicitado devido à manutenção preventiva do lote.",
    },
    {
      id: "markers-03",
      name: "Pincéis Atômicos Recarregáveis",
      description: "Kit com três cores para quadro branco",
      quantity: 1,
      code: "KIT-PIN-03",
      status: "DEVOLVIDO",
      pickup: {
        date: "24/09/2026 às 07:25",
        attendant: "Marcos Silva",
      },
      return: {
        dueDate: "24/09/2026 às 21:00",
        date: "24/09/2026 às 11:15",
        attendant: "Ana Paula",
        condition: "Devolvido em perfeitas condições",
      },
    },
  ],
  timeline: [
    {
      id: "next-step",
      date: "Hoje, até 21:00",
      title: "Devolução da chave da Sala J-02",
      description: "Entregue a chave no guichê presencial da Secretaria J-02.",
      isNextStep: true,
    },
    {
      id: "markers-returned",
      date: "24/09/2026 às 11:15",
      title: "Pincéis devolvidos e conferidos",
      description: "Item recebido em perfeitas condições por Ana Paula.",
    },
    {
      id: "key-picked-up",
      date: "24/09/2026 às 07:25",
      title: "Chave retirada presencialmente",
      description: "Termo de responsabilidade confirmado no balcão.",
    },
    {
      id: "reviewed",
      date: "23/09/2026 às 16:30",
      title: "Itens analisados pela Secretaria Técnica",
      description:
        "Itens aprovados individualmente e indisponibilidade registrada.",
    },
    {
      id: "created",
      date: "23/09/2026 às 09:15",
      title: "Solicitação enviada",
      description: "Pedido registrado pelo portal acadêmico.",
    },
  ],
};

const statusLabels: Record<RequestItemStatus, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  RECUSADO: "Recusado",
  RETIRADO: "Retirado",
  DEVOLVIDO: "Devolvido",
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function RequestDetailsScreen({
  request = defaultRequest,
  onBack,
}: RequestDetailsScreenProps) {
  const activeCustodyItems = request.items.filter(
    (item) => item.status === "RETIRADO",
  );

  return (
    <div className="request-details-page">
      <header className="request-details-header">
        <div className="request-details-container request-details-header-inner">
          <div className="request-details-brand">
            <span aria-hidden="true">CCT</span>
            <div>
              <img src="/brand/unifor.svg" alt="UNIFOR" />
              <small>Controle de Empréstimos · Bloco J-02</small>
            </div>
          </div>

          <button className="request-details-header-back" onClick={onBack}>
            <span aria-hidden="true">←</span>
            Voltar para minhas solicitações
          </button>
        </div>
      </header>

      <main className="request-details-container request-details-content">
        <nav
          className="request-details-breadcrumb"
          aria-label="Navegação estrutural"
        >
          <button onClick={onBack}>Minhas solicitações</button>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Detalhes do pedido</span>
        </nav>

        <section
          className="request-details-hero"
          aria-labelledby="request-details-title"
        >
          <div>
            <span className="request-details-eyebrow">Protocolo CCT</span>
            <h1 id="request-details-title">
              Solicitação <strong>#{request.protocol}</strong>
            </h1>
            <p>
              Acompanhe a análise, a custódia dos itens e todo o histórico desta
              solicitação.
            </p>
          </div>

          <div className="request-details-hero-side">
            <span className="request-details-overall-status">
              <i aria-hidden="true" />
              {request.statusLabel}
            </span>
            <span className="request-details-protocol">
              #{request.protocol}
            </span>
          </div>
        </section>

        <div className="request-details-layout">
          <div className="request-details-main-column">
            <section
              className="request-details-card"
              aria-labelledby="request-summary-title"
            >
              <div className="request-details-section-heading">
                <span
                  className="request-details-section-icon"
                  aria-hidden="true"
                >
                  i
                </span>
                <div>
                  <h2 id="request-summary-title">Resumo da solicitação</h2>
                  <p>Dados registrados no envio do pedido</p>
                </div>
              </div>

              <dl className="request-details-summary-grid">
                <div>
                  <dt>Solicitante</dt>
                  <dd>
                    <span className="request-details-avatar" aria-hidden="true">
                      {initials(request.requester.name)}
                    </span>
                    <span>
                      <strong>{request.requester.name}</strong>
                      <small>
                        {request.requester.role} ·{" "}
                        {request.requester.registration}
                      </small>
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Finalidade</dt>
                  <dd>{request.purpose}</dd>
                </div>
                <div>
                  <dt>Local de uso</dt>
                  <dd>{request.location}</dd>
                </div>
                <div>
                  <dt>Período</dt>
                  <dd>{request.period}</dd>
                </div>
                <div>
                  <dt>Solicitado em</dt>
                  <dd>{request.requestedAt}</dd>
                </div>
                {request.notes && (
                  <div>
                    <dt>Observações</dt>
                    <dd>{request.notes}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section
              className="request-details-items"
              aria-labelledby="request-items-title"
            >
              <div className="request-details-section-title-row">
                <div>
                  <h2 id="request-items-title">Itens solicitados</h2>
                  <p>Cada item é analisado e movimentado individualmente.</p>
                </div>
                <span>{request.items.length} itens</span>
              </div>

              <div className="request-details-item-list">
                {request.items.map((item) => (
                  <article className="request-details-item" key={item.id}>
                    <div className="request-details-item-top">
                      <div className="request-details-item-copy">
                        <span
                          className="request-details-item-icon"
                          aria-hidden="true"
                        >
                          {item.name.toLowerCase().includes("chave")
                            ? "⌁"
                            : "□"}
                        </span>
                        <div>
                          <div className="request-details-item-name">
                            <h3>{item.name}</h3>
                            {item.code && <code>{item.code}</code>}
                          </div>
                          <p>
                            {item.description} · Qtd.: {item.quantity}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`request-details-status request-details-status-${item.status.toLowerCase()}`}
                      >
                        {statusLabels[item.status]}
                      </span>
                    </div>

                    {item.status === "APROVADO" && (
                      <p className="request-details-item-notice approved">
                        Disponível para retirada no guichê da Secretaria J-02.
                      </p>
                    )}

                    {item.status === "RETIRADO" && item.return && (
                      <p className="request-details-item-notice custody">
                        <strong>Custódia ativa.</strong> Este item permanece sob
                        sua responsabilidade. Devolução prevista até{" "}
                        {item.return.dueDate}.
                      </p>
                    )}

                    {item.status === "RECUSADO" && item.rejectionReason && (
                      <p className="request-details-item-notice rejected">
                        <strong>Motivo da recusa:</strong>{" "}
                        {item.rejectionReason}
                      </p>
                    )}

                    {item.status === "DEVOLVIDO" && item.return?.date && (
                      <p className="request-details-item-notice returned">
                        {item.return.condition ?? "Item devolvido"} em{" "}
                        {item.return.date}.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside
            className="request-details-side-column"
            aria-label="Movimentação e histórico"
          >
            <section
              className="request-details-card"
              aria-labelledby="request-movement-title"
            >
              <div className="request-details-section-heading">
                <span
                  className="request-details-section-icon"
                  aria-hidden="true"
                >
                  ↔
                </span>
                <div>
                  <h2 id="request-movement-title">Retirada e devolução</h2>
                  <p>Movimentação presencial dos itens</p>
                </div>
              </div>

              <div className="request-details-movements">
                {request.items
                  .filter((item) => item.pickup || item.status === "APROVADO")
                  .map((item) => (
                    <article key={item.id}>
                      <div>
                        <h3>{item.name}</h3>
                        <span>{statusLabels[item.status]}</span>
                      </div>
                      {item.pickup ? (
                        <p>
                          <strong>Retirada:</strong> {item.pickup.date}
                          <small>Entregue por {item.pickup.attendant}</small>
                        </p>
                      ) : (
                        <p>Aguardando retirada no balcão.</p>
                      )}
                      {item.return?.date ? (
                        <p>
                          <strong>Devolução:</strong> {item.return.date}
                          {item.return.attendant && (
                            <small>Recebido por {item.return.attendant}</small>
                          )}
                        </p>
                      ) : item.return ? (
                        <p>
                          <strong>Prazo:</strong> {item.return.dueDate}
                        </p>
                      ) : null}
                    </article>
                  ))}
              </div>

              {activeCustodyItems.length > 0 && (
                <div className="request-details-custody-alert" role="note">
                  <strong>{activeCustodyItems.length} item em sua posse</strong>
                  <span>
                    Faça a devolução presencial dentro do prazo indicado.
                  </span>
                </div>
              )}
            </section>

            <section
              className="request-details-card"
              aria-labelledby="request-history-title"
            >
              <div className="request-details-section-heading">
                <span
                  className="request-details-section-icon"
                  aria-hidden="true"
                >
                  ◷
                </span>
                <div>
                  <h2 id="request-history-title">Histórico do pedido</h2>
                  <p>Linha do tempo auditada</p>
                </div>
              </div>

              <ol className="request-details-timeline">
                {request.timeline.map((entry) => (
                  <li
                    className={entry.isNextStep ? "next-step" : ""}
                    key={entry.id}
                  >
                    <time>{entry.date}</time>
                    <strong>{entry.title}</strong>
                    <p>{entry.description}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="request-details-support" aria-label="Suporte">
              <span aria-hidden="true">?</span>
              <div>
                <strong>Secretaria Bloco J-02</strong>
                <small>Atendimento: 07h às 21h30 · Ramal 3477-3120</small>
              </div>
            </section>
          </aside>
        </div>

        <button className="request-details-bottom-back" onClick={onBack}>
          <span aria-hidden="true">←</span>
          Voltar para minhas solicitações
        </button>
      </main>
    </div>
  );
}

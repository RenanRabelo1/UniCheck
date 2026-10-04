type UserProfile = {
  name: string
  registration: string
  roleLabel: string
}

type UserDashboardProps = {
  user: UserProfile
  onLogout: () => void
}

const recentActivity = [
  {
    icon: '▣',
    title: 'Notebook Dell Latitude + carregador',
    detail: 'Solicitado hoje, 14:15 · Retirada autorizada na secretaria',
    status: 'Aprovada',
    tone: 'approved',
  },
  {
    icon: '◉',
    title: 'Projetor Epson WXGA + adaptador HDMI/USB-C',
    detail: 'Em posse desde 23/10, 09:30 · Patrimônio #24810',
    status: 'Em posse',
    tone: 'active',
  },
  {
    icon: '◈',
    title: 'Kit Arduino e Sensores IoT - Bancada B02',
    detail: 'Devolvido em 21/10, 17:45 · Conferido pela equipe de suporte',
    status: 'Devolvida',
    tone: 'returned',
  },
]

const summaryCards = [
  {
    icon: '◷',
    value: '01',
    title: 'Pendentes',
    description: 'Solicitações registradas aguardando validação pela secretaria.',
    footer: 'Ver detalhes do pedido',
    accent: 'soft',
  },
  {
    icon: '✓',
    value: '02',
    title: 'Aprovadas',
    description: 'Itens autorizados e disponíveis para retirada no balcão.',
    footer: 'Pronto para retirada',
    accent: 'blue',
  },
  {
    icon: '▣',
    value: '03',
    title: 'Materiais em posse',
    description: 'Equipamentos sob sua custódia com devolução obrigatória.',
    footer: 'Devolução até 22:40',
    accent: 'strong',
  },
]

export function UserDashboard({ user, onLogout }: UserDashboardProps) {
  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-brand">
            <img src="/brand/unifor.svg" alt="Unifor" />
            <span />
            <div>
              <strong>Sistema CCT</strong>
              <small>Controle de Empréstimos · Bloco J-02</small>
            </div>
          </div>
          <nav aria-label="Navegação principal" className="dashboard-nav">
            <a className="active" href="#inicio">Início</a>
            <a href="#solicitacoes">Minhas solicitações</a>
            <a href="#materiais">Materiais</a>
          </nav>
          <div className="profile-menu">
            <div className="profile-avatar" aria-hidden="true">{user.name.charAt(0)}</div>
            <div className="profile-copy">
              <strong>{user.name}</strong>
              <small>{user.roleLabel} · Bloco J-02</small>
            </div>
            <button type="button" onClick={onLogout} aria-label="Encerrar sessão" title="Encerrar sessão">↪</button>
          </div>
        </div>
      </header>

      <section className="dashboard-content" id="inicio">
        <section className="welcome-card" aria-labelledby="welcome-title">
          <div className="welcome-copy">
            <span className="campus-tag"><i /> Centro de Ciências Tecnológicas · Bloco J-02</span>
            <h1 id="welcome-title">Olá, <em>{user.name}</em></h1>
            <p>Acompanhe suas solicitações ativas, histórico e os materiais sob sua responsabilidade na Secretaria do Bloco J-02.</p>
            <div className="welcome-meta">
              <span><i /> Matrícula: <b>{user.registration}</b></span>
              <span>◷ Secretaria aberta até as <b>21h00</b></span>
            </div>
          </div>
          <div className="welcome-art" aria-hidden="true">
            <div className="art-circle" />
            <div className="art-triangle" />
            <div className="art-plus">+</div>
          </div>
        </section>

        <section className="dashboard-actions" aria-label="Ações rápidas">
          <div className="action-buttons">
            <button type="button" className="primary-action">⊕ Nova solicitação</button>
            <button type="button" className="secondary-action">◷ Minhas solicitações</button>
          </div>
          <p><b>ⓘ</b> Atendimento presencial no Bloco J-02: <strong>07h30 às 21h00</strong></p>
        </section>

        <section className="summary-grid" aria-label="Resumo de solicitações">
          {summaryCards.map((card) => (
            <article className={`summary-card ${card.accent}`} key={card.title}>
              <div className="summary-top">
                <span className="summary-icon">{card.icon}</span>
                <strong>{card.value}</strong>
              </div>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
              <span className="summary-footer">{card.footer} <b>›</b></span>
            </article>
          ))}
        </section>

        <section className="activity-card" id="solicitacoes" aria-labelledby="activity-title">
          <div className="activity-heading">
            <div>
              <h2 id="activity-title">Atividade recente</h2>
              <p>Últimas movimentações de materiais, kits didáticos e chaves de laboratório</p>
            </div>
            <button type="button">Ver todas as solicitações →</button>
          </div>
          <div className="activity-list">
            {recentActivity.map((item) => (
              <article className="activity-row" key={item.title}>
                <span className="activity-icon">{item.icon}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
                <span className={`status-pill ${item.tone}`}>{item.status}</span>
              </article>
            ))}
          </div>
          <footer className="support-row">
            <span>ⓘ Dúvidas ou necessidade de reserva antecipada para aulas práticas?</span>
            <strong>Ramal J-02: 3477-3120</strong>
          </footer>
        </section>
      </section>

      <footer className="dashboard-footer">
        <span>Universidade de Fortaleza (UNIFOR) · Centro de Ciências Tecnológicas (CCT)</span>
        <span>Laboratório de Apoio e Recursos · Bloco J-02</span>
      </footer>
    </main>
  )
}

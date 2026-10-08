import { useRef, useState } from 'react'
import type { DashboardSession } from '../modules/dashboard/dashboard.types'
import { useDashboard } from '../modules/dashboard/useDashboard'
import './StudentDashboard.css'

type StudentDashboardProps = {
  session: DashboardSession
  onLogout: () => void
  onNewRequest: () => void
}

type IconName = 'home' | 'plus' | 'list' | 'check' | 'key' | 'logout'

function Icon({ name }: { name: IconName }) {
  const paths = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9M9 21v-8h6v8" />
      </>
    ),
    plus: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    list: (
      <>
        <path d="M9 5H5v16h14V5h-4" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M8 11h8M8 15h8" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    key: (
      <>
        <circle cx="8" cy="15" r="5" />
        <path d="m12 11 8-8 2 3-3 3-2-2" />
      </>
    ),
    logout: <path d="M9 4H4v16h5M10 12h11m-4-4 4 4-4 4" />,
  }

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export function StudentDashboard({
  session,
  onLogout,
  onNewRequest,
}: StudentDashboardProps) {
  const { data, error, isLoading, reload } = useDashboard(session)

  const activityRef = useRef<HTMLElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const [selectedActivity, setSelectedActivity] = useState<{
    title: string
    detail: string
    status: string
  } | null>(null)

  function showActivity() {
    activityRef.current?.scrollIntoView({ block: 'start' })
    activityRef.current?.focus({ preventScroll: true })
  }

  if (isLoading) {
    return (
      <main className="student-home student-feedback" role="status">
        Carregando painel do aluno...
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="student-home student-feedback">
        <p role="alert">
          {error ?? 'Não foi possível carregar o painel.'}
        </p>

        <div className="student-actions">
          <button
            className="student-button student-primary"
            onClick={() => void reload()}
          >
            Tentar novamente
          </button>

          <button
            className="student-button student-outline"
            onClick={onLogout}
          >
            Voltar ao login
          </button>
        </div>
      </main>
    )
  }

  const { user, summary, recentActivity } = data

  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')

  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const summaryCards: {
    title: string
    value: number
    description: string
    icon: IconName
    color: string
  }[] = [
    {
      title: 'Solicitações pendentes',
      value: summary.pending,
      description: 'Aguardando análise da secretaria',
      icon: 'list',
      color: 'orange',
    },
    {
      title: 'Solicitações aprovadas',
      value: summary.approved,
      description: 'Prontas para retirada',
      icon: 'check',
      color: 'green',
    },
    {
      title: 'Materiais em posse',
      value: summary.inPossession,
      description: 'Itens retirados e não devolvidos',
      icon: 'key',
      color: 'blue',
    },
  ]

  return (
    <div className="student-home">
      <header className="student-header">
        <div className="student-container student-header-inner">
          <div className="student-brand">
            <span className="student-brand-mark">CCT</span>

            <div>
              <img src="/brand/unifor.svg" alt="UNIFOR" />
              <small>C. Ciências Tecnológicas</small>
            </div>
          </div>

          <nav className="student-nav" aria-label="Menu do aluno">
            <button
              className="student-nav-active"
              aria-current="page"
              onClick={() => window.scrollTo({ top: 0 })}
            >
              <Icon name="home" />
              Início
            </button>

            <button onClick={onNewRequest}>
              <Icon name="plus" />
              Nova Solicitação
            </button>

            <button onClick={showActivity}>
              <Icon name="list" />
              Minhas Solicitações
            </button>
          </nav>

          <div className="student-profile">
            <span className="student-avatar" aria-hidden="true">
              {initials}
            </span>

            <div className="student-profile-info">
              <strong>{user.name}</strong>
              <span>{user.roleLabel}</span>
            </div>

            <button className="student-logout" onClick={onLogout}>
              <Icon name="logout" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="student-container student-content">
        <section className="student-welcome" aria-labelledby="student-title">
          <div className="student-decoration" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          <div className="student-welcome-copy">
            <span className="student-campus">
              <i />
              Centro de Ciências Tecnológicas · Bloco J-02
            </span>

            <h1 id="student-title">
              Olá, <span>{user.name}</span>
            </h1>

            <p className="student-date">{today}</p>

            <div className="student-meta">
              <span>
                <i />
                Identificação: <strong>{user.registration}</strong>
              </span>

              <span>
                <Icon name="check" />
                Perfil: <strong>{user.roleLabel}</strong>
              </span>
            </div>
          </div>

          <div className="student-actions">
            <button
              className="student-button student-primary"
              onClick={onNewRequest}
            >
              <Icon name="plus" />
              Nova Solicitação
            </button>

            <button
              className="student-button student-outline"
              onClick={showActivity}
            >
              <Icon name="list" />
              Minhas Solicitações
            </button>
          </div>
        </section>

        <section className="student-summary" aria-label="Resumo">
          {summaryCards.map((card) => (
            <article
              key={card.title}
              className={`student-stat student-stat-${card.color}`}
            >
              <div>
                <h2>{card.title}</h2>
                <strong className="student-stat-value">{card.value}</strong>
                <p>{card.description}</p>
              </div>

              <span className="student-stat-icon">
                <Icon name={card.icon} />
              </span>
            </article>
          ))}
        </section>

        <section className="student-shortcuts" aria-label="Acesso rápido">
          <button className="student-shortcut" onClick={onNewRequest}>
            <span className="student-shortcut-icon student-shortcut-primary">
              <Icon name="plus" />
            </span>

            <span>
              <strong>Nova Solicitação</strong>
              <small>Solicite chaves para seu projeto</small>
            </span>
          </button>

          <button className="student-shortcut" onClick={showActivity}>
            <span className="student-shortcut-icon">
              <Icon name="list" />
            </span>

            <span>
              <strong>Minhas Solicitações</strong>
              <small>Acompanhe suas atividades recentes</small>
            </span>
          </button>
        </section>

        <section
          ref={activityRef}
          className="student-activity"
          aria-labelledby="student-activity-title"
          tabIndex={-1}
        >
          <div className="student-activity-heading">
            <h2 id="student-activity-title">Atividade Recente</h2>

            <button
              className="student-link"
              onClick={() => void reload()}
            >
              Atualizar
            </button>
          </div>

          <div
            className="student-table-wrapper"
            role="region"
            aria-label="Tabela de atividades recentes"
            tabIndex={0}
          >
            <table className="student-table">
              <thead>
                <tr>
                  <th scope="col">Solicitação / atividade</th>
                  <th scope="col">Descrição</th>
                  <th scope="col">Status</th>
                  <th scope="col">Ação</th>
                </tr>
              </thead>

              <tbody>
                {recentActivity.map((item, index) => (
                  <tr key={`${item.title}-${index}`}>
                    <td>{item.title}</td>
                    <td>{item.detail}</td>
                    <td>
                      <span className="student-status">
                        <i />
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="student-link"
                        aria-label={`Ver detalhes: ${item.title}`}
                        onClick={() => {
                          setSelectedActivity({
                            title: item.title,
                            detail: item.detail,
                            status: item.status,
                          })
                          dialogRef.current?.showModal()
                        }}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}

                {recentActivity.length === 0 && (
                  <tr>
                    <td colSpan={4} className="student-empty">
                      Nenhuma atividade recente encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <dialog
        ref={dialogRef}
        className="student-dialog"
        aria-labelledby="student-dialog-title"
      >
        <h2 id="student-dialog-title">Detalhes da atividade</h2>

        {selectedActivity && (
          <>
            <h3>{selectedActivity.title}</h3>
            <p>{selectedActivity.detail}</p>
            <p>
              <strong>Status:</strong> {selectedActivity.status}
            </p>
          </>
        )}

        <button
          className="student-button student-primary"
          onClick={() => dialogRef.current?.close()}
          autoFocus
        >
          Fechar
        </button>
      </dialog>
    </div>
  )
}
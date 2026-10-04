import { FormEvent, useState } from 'react'
import { UserDashboard } from './components/UserDashboard'

type Role = 'professor' | 'student' | 'coordinator'

const roles: { id: Role; label: string; accessLabel: string }[] = [
  { id: 'professor', label: 'Professor', accessLabel: 'Acesso do professor' },
  { id: 'student', label: 'Aluno', accessLabel: 'Acesso do aluno' },
  { id: 'coordinator', label: 'Coordenador CCT', accessLabel: 'Acesso do coordenador' },
]

const quickAccess = [
  { label: 'Prof. Ricardo Mendes', identifier: '2048819', role: 'professor' as const },
  { label: 'Aluno Autorizado', identifier: 'aluno.autorizado@unifor.br', role: 'student' as const },
  { label: 'Coordenador CCT', identifier: '18024900', role: 'coordinator' as const },
  { label: 'Aluno s/ Autorização', identifier: 'aluno.naoautorizado@unifor.br', role: 'student' as const },
]

const highlights = [
  ['🔑', 'Chaves de salas', 'Laboratórios e salas de aula'],
  ['📽️', 'Equipamentos', 'Projetores, adaptadores e kits'],
  ['📋', 'Controle total', 'Histórico completo de uso'],
  ['👤', 'Multi-perfil', 'Docentes e discentes autorizados'],
]

function App() {
  const [role, setRole] = useState<Role>('professor')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success'>('error')
  const [showDashboard, setShowDashboard] = useState(false)

  const isStudent = role === 'student'
  const currentRole = roles.find((item) => item.id === role)!
  const identifierLabel = isStudent ? 'E-mail institucional' : 'Matrícula'
  const identifierPlaceholder = isStudent
    ? 'seu.email@unifor.br'
    : role === 'professor'
      ? 'Ex.: 2048819'
      : 'Ex.: 18024900'

  function changeRole(nextRole: Role) {
    setRole(nextRole)
    setIdentifier('')
    setPassword('')
    setMessage('')
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!identifier.trim()) {
      setMessage(`Informe ${identifierLabel.toLowerCase()}.`)
      setMessageType('error')
      return
    }
    if (!password.trim()) {
      setMessage('Informe sua senha.')
      setMessageType('error')
      return
    }
    if (role === 'coordinator' && password.length < 8) {
      setMessage('A senha do Coordenador CCT deve ter no mínimo 8 caracteres.')
      setMessageType('error')
      return
    }

    if (role === 'coordinator') {
      setMessage('Dados validados. O painel administrativo será conectado à API na próxima etapa.')
      setMessageType('success')
      return
    }

    setShowDashboard(true)
  }

  function fillQuickAccess(item: (typeof quickAccess)[number]) {
    setRole(item.role)
    setIdentifier(item.identifier)
    setPassword('')
    setMessage('Dados de demonstração preenchidos. Informe uma senha para continuar.')
    setMessageType('success')
  }

  if (showDashboard) {
    const isStudentDashboard = role === 'student'
    return (
      <UserDashboard
        user={{
          name: isStudentDashboard ? 'Lucas Almeida' : 'Prof. Ricardo Mendes',
          registration: isStudentDashboard ? 'aluno.autorizado@unifor.br' : '2048819/CCT',
          roleLabel: isStudentDashboard ? 'Aluno autorizado' : 'Professor',
        }}
        onLogout={() => {
          setShowDashboard(false)
          setPassword('')
          setMessage('Sessão encerrada.')
          setMessageType('success')
        }}
      />
    )
  }

  return (
    <main className="login-page">
      <div className="glow glow-top" />
      <div className="glow glow-bottom" />
      <section className="login-card" aria-label="Acesso ao sistema UniCheck">
        <div className="form-panel">
          <header className="brand-header">
            <div className="brand-lockup">
              <span className="cct-mark">CCT</span>
              <img src="/brand/unifor.svg" alt="Unifor" className="unifor-logo" />
              <span className="brand-subtitle">C. Ciências Tecnológicas</span>
            </div>
            <span className="location-badge">Bloco J-02</span>
          </header>

          <div className="form-intro">
            <h1>Acesso ao Sistema</h1>
            <p>Selecione seu perfil para continuar</p>
          </div>

          <div className="role-tabs" role="tablist" aria-label="Perfil de acesso">
            {roles.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={role === item.id}
                className={role === item.id ? 'active' : ''}
                onClick={() => changeRole(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={submitLogin} noValidate>
            <div className="access-type">⌾ {currentRole.accessLabel}</div>
            <label htmlFor="identifier">{identifierLabel}</label>
            <input
              id="identifier"
              type={isStudent ? 'email' : 'text'}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder={identifierPlaceholder}
              autoComplete={isStudent ? 'email' : 'username'}
            />

            <label htmlFor="password">
              Senha {role === 'coordinator' && <small>(mínimo 8 caracteres)</small>}
            </label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="visibility-button"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? '◉' : '◌'}
              </button>
            </div>

            {message && <p className={`form-message ${messageType}`} role="status">{message}</p>}

            <button className="submit-button" type="submit">Acessar <span aria-hidden="true">→</span></button>
          </form>

          <div className="quick-access">
            <p>Acesso rápido (demonstração)</p>
            {quickAccess.map((item, index) => (
              <button
                key={item.identifier}
                type="button"
                className={index === quickAccess.length - 1 ? 'quick-item dashed' : 'quick-item'}
                onClick={() => fillQuickAccess(item)}
              >
                <span>{item.label}</span>
                <small>{item.identifier}</small>
              </button>
            ))}
            <small className="hint">Os dados são apenas demonstrativos; a validação real será feita pela API.</small>
          </div>
        </div>

        <aside className="info-panel">
          <div className="blue-pattern" aria-hidden="true" />
          <span className="secretariat-status"><i /> Secretaria · Bloco J-02</span>
          <div className="info-content">
            <h2>Gestão inteligente de recursos acadêmicos.</h2>
            <p>Controle unificado para requisição, custódia e devolução de chaves e equipamentos do Centro de Ciências Tecnológicas.</p>
            <div className="feature-grid">
              {highlights.map(([icon, title, description]) => (
                <article key={title}>
                  <span>{icon}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
          <footer>
            <div>
              <strong>Secretaria CCT · Bloco J-02</strong>
              <span>Atendimento: Segunda a Sexta, 07h30–21h00</span>
            </div>
            <b>UNIFOR <small>CCT · J-02</small></b>
          </footer>
        </aside>
      </section>
    </main>
  )
}

export default App

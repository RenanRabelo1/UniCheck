import type { FormEvent } from "react";
import {
  demoRoles,
  quickAccess,
  type DemoRole,
  type QuickAccess,
} from "./demoSession";

type DemoLoginProps = {
  role: DemoRole;
  identifier: string;
  password: string;
  showPassword: boolean;
  message: string;
  messageType: "error" | "success";
  isStudent: boolean;
  identifierLabel: string;
  identifierPlaceholder: string;
  onRoleChange: (role: DemoRole) => void;
  onIdentifierChange: (identifier: string) => void;
  onPasswordChange: (password: string) => void;
  onPasswordVisibilityToggle: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onQuickAccess: (item: QuickAccess) => void;
};

const highlights = [
  ["🔑", "Chaves de salas", "Laboratórios e salas de aula"],
  ["📽️", "Equipamentos", "Projetores, adaptadores e kits"],
  ["📋", "Controle total", "Histórico completo de uso"],
  ["👤", "Multi-perfil", "Docentes e discentes autorizados"],
];

export function DemoLogin({
  role,
  identifier,
  password,
  showPassword,
  message,
  messageType,
  isStudent,
  identifierLabel,
  identifierPlaceholder,
  onRoleChange,
  onIdentifierChange,
  onPasswordChange,
  onPasswordVisibilityToggle,
  onSubmit,
  onQuickAccess,
}: DemoLoginProps) {
  const currentRole = demoRoles.find((item) => item.id === role)!;

  return (
    <main className="login-page">
      <div className="glow glow-top" />
      <div className="glow glow-bottom" />
      <section className="login-card" aria-label="Acesso ao sistema UniCheck">
        <div className="form-panel">
          <header className="brand-header">
            <div className="brand-lockup">
              <span className="cct-mark">CCT</span>
              <img
                src="/brand/unifor.svg"
                alt="Unifor"
                className="unifor-logo"
              />
              <span className="brand-subtitle">C. Ciências Tecnológicas</span>
            </div>
            <span className="location-badge">Bloco J-02</span>
          </header>

          <div className="form-intro">
            <h1>Acesso ao Sistema</h1>
            <p>Selecione seu perfil para continuar</p>
          </div>

          <div
            className="role-tabs"
            role="tablist"
            aria-label="Perfil de acesso"
          >
            {demoRoles.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={role === item.id}
                className={role === item.id ? "active" : ""}
                onClick={() => onRoleChange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} noValidate>
            <div className="access-type">⌾ {currentRole.accessLabel}</div>
            <label htmlFor="identifier">{identifierLabel}</label>
            <input
              id="identifier"
              type={isStudent ? "email" : "text"}
              value={identifier}
              onChange={(event) => onIdentifierChange(event.target.value)}
              placeholder={identifierPlaceholder}
              autoComplete={isStudent ? "email" : "username"}
            />

            <label htmlFor="password">
              Senha{" "}
              {role === "coordinator" && <small>(mínimo 8 caracteres)</small>}
            </label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="visibility-button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={onPasswordVisibilityToggle}
              >
                {showPassword ? "◉" : "◌"}
              </button>
            </div>

            {message && (
              <p className={`form-message ${messageType}`} role="status">
                {message}
              </p>
            )}

            <button className="submit-button" type="submit">
              Acessar <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="quick-access">
            <p>Acesso rápido (demonstração)</p>
            {quickAccess.map((item, index) => (
              <button
                key={item.identifier}
                type="button"
                className={
                  index === quickAccess.length - 1
                    ? "quick-item dashed"
                    : "quick-item"
                }
                onClick={() => onQuickAccess(item)}
              >
                <span>{item.label}</span>
                <small>{item.identifier}</small>
              </button>
            ))}
            <small className="hint">
              Os dados são apenas demonstrativos; a validação real será feita
              pela API.
            </small>
          </div>
        </div>

        <aside className="info-panel">
          <div className="blue-pattern" aria-hidden="true" />
          <span className="secretariat-status">
            <i /> Secretaria · Bloco J-02
          </span>
          <div className="info-content">
            <h2>Gestão inteligente de recursos acadêmicos.</h2>
            <p>
              Controle unificado para requisição, custódia e devolução de chaves
              e equipamentos do Centro de Ciências Tecnológicas.
            </p>
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
            <b>
              UNIFOR <small>CCT · J-02</small>
            </b>
          </footer>
        </aside>
      </section>
    </main>
  );
}

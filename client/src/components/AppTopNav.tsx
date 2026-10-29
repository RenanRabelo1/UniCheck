import "./AppTopNav.css";

export type AppTopNavProps = {
  user: { name: string; roleLabel: string };
  /** Qual item do menu está aberto agora. */
  active: "home" | "new" | "requests";
  onHome: () => void;
  onNewRequest: () => void;
  onMyRequests: () => void;
  /** Se informado, aparece o item "Materiais" (só professor). */
  onMaterials?: () => void;
  /** Se informado, aparece o botão "Sair". */
  onLogout?: () => void;
};

/** Só as ações extras da barra: cada tela recebe isso pronto do AppShell. */
export type AppTopNavExtras = Pick<AppTopNavProps, "onMaterials" | "onLogout">;

/** Barra do topo das telas de solicitação: o mesmo menu aparece em todas elas. */
export function AppTopNav({
  user,
  active,
  onHome,
  onNewRequest,
  onMyRequests,
  onMaterials,
  onLogout,
}: AppTopNavProps) {
  const items = [
    { id: "home", label: "Início", onClick: onHome },
    { id: "new", label: "Nova solicitação", onClick: onNewRequest },
    { id: "requests", label: "Minhas solicitações", onClick: onMyRequests },
    ...(onMaterials
      ? [{ id: "materials", label: "Materiais", onClick: onMaterials }]
      : []),
  ];

  return (
    <header className="app-nav">
      <div className="app-nav__content">
        <button className="app-nav-brand" type="button" onClick={onHome}>
          <img src="/brand/unifor.svg" alt="Unifor" />
          <span aria-hidden="true" />
          <span>
            <strong>Sistema CCT</strong>
            <small>Controle de Empréstimos · Bloco J-02</small>
          </span>
        </button>

        <nav className="app-nav-links" aria-label="Navegação principal">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={active === item.id ? "active" : undefined}
              aria-current={active === item.id ? "page" : undefined}
              onClick={item.onClick}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="app-nav-profile">
          <span className="app-nav-profile__copy">
            <strong>{user.name}</strong>
            <small>{user.roleLabel} · Bloco J-02</small>
          </span>
          <span className="app-nav-profile__avatar" aria-hidden="true">
            {user.name.charAt(0).toUpperCase()}
          </span>
          {onLogout && (
            <button
              type="button"
              className="app-nav-logout"
              onClick={onLogout}
              aria-label="Encerrar sessão"
              title="Encerrar sessão"
            >
              ↪ Sair
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

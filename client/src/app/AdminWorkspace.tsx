import type { ReactNode } from "react";

import type { AdminView } from "./navigation";
import "./AdminWorkspace.css";

type AdminWorkspaceProps = {
  activeView: AdminView;
  onBackToDashboard: () => void;
  onSelectView: (view: AdminView) => void;
  selectedRequestId?: string | null;
  children: ReactNode;
};

const adminViews: Array<{ view: AdminView; label: string }> = [
  { view: "admin-pending", label: "Pendências" },
  { view: "admin-analysis", label: "Análise" },
  { view: "admin-checkout", label: "Retirada" },
  { view: "admin-return", label: "Devolução" },
  { view: "admin-alerts", label: "Atrasos" },
  { view: "admin-materials", label: "Materiais" },
  { view: "admin-rooms-keys", label: "Salas e chaves" },
  { view: "admin-authorizations", label: "Autorizações" },
  { view: "admin-history", label: "Histórico" },
];

/** Moldura de navegação exclusivamente visual para os módulos administrativos. */
export function AdminWorkspace({
  activeView,
  onBackToDashboard,
  onSelectView,
  selectedRequestId,
  children,
}: AdminWorkspaceProps) {
  return (
    <div className="admin-workspace">
      <header className="admin-workspace__header">
        <div>
          <button type="button" className="admin-workspace__back" onClick={onBackToDashboard}>
            ← Painel administrativo
          </button>
          <p>Secretaria CCT · ambiente demonstrativo</p>
        </div>
        <span>
          {selectedRequestId
            ? `Solicitação em demonstração: ${selectedRequestId}. `
            : ""}
          Dados locais — nenhuma alteração é persistida.
        </span>
      </header>

      <nav className="admin-workspace__nav" aria-label="Telas administrativas demonstrativas">
        {adminViews.map((item) => (
          <button
            type="button"
            key={item.view}
            className={item.view === activeView ? "is-active" : undefined}
            aria-current={item.view === activeView ? "page" : undefined}
            onClick={() => onSelectView(item.view)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {children}
    </div>
  );
}

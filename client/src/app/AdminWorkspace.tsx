import { isApiMode } from "../services/api";
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

/** Identifica quais módulos já persistem as alterações. */
export function AdminWorkspace({
  activeView,
  onBackToDashboard,
  onSelectView,
  selectedRequestId,
  children,
}: AdminWorkspaceProps) {
  const connected =
    isApiMode() && ["admin-pending", "admin-analysis"].includes(activeView);
  return (
    <div className="admin-workspace">
      <header className="admin-workspace__header">
        <div>
          <button
            type="button"
            className="admin-workspace__back"
            onClick={onBackToDashboard}
          >
            ← Painel administrativo
          </button>
          <p>
            Secretaria CCT ·{" "}
            {connected ? "Solicitações" : "ambiente demonstrativo"}
          </p>
        </div>
        <span>
          {connected ? (
            "Pedidos reais · Os pareceres são salvos no sistema."
          ) : (
            <>
              {selectedRequestId
                ? `Solicitação em demonstração: ${selectedRequestId}. `
                : ""}
              Dados locais — nenhuma alteração é persistida.
            </>
          )}
        </span>
      </header>

      <nav className="admin-workspace__nav" aria-label="Telas administrativas">
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

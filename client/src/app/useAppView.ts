import { useCallback, useEffect, useState } from "react";

import type { AppView } from "./navigation";

// Telas que abrem sozinhas. Confirmação, detalhes e análise dependem de um pedido escolhido antes,
// então não entram no endereço: recarregar nelas volta para a tela anterior.
const addressableViews: AppView[] = [
  "professor-materials",
  "new-request",
  "my-requests",
  "admin-pending",
  "admin-checkout",
  "admin-return",
  "admin-alerts",
  "admin-materials",
  "admin-rooms-keys",
  "admin-authorizations",
  "admin-history",
];

function readView(): AppView {
  const view = window.location.hash.replace(/^#\//, "") as AppView;
  return addressableViews.includes(view) ? view : "dashboard";
}

/** Tela atual guardada no endereço: permite recarregar a página e usar o botão Voltar do navegador. */
export function useAppView() {
  const [view, setView] = useState<AppView>(readView);

  useEffect(() => {
    const sync = () => setView(readView());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const goTo = useCallback((next: AppView) => {
    setView(next);
    if (next !== "dashboard" && !addressableViews.includes(next)) return;
    const address =
      next === "dashboard" ? window.location.pathname : `#/${next}`;
    if (next !== readView()) window.history.pushState(null, "", address);
  }, []);

  return [view, goTo] as const;
}

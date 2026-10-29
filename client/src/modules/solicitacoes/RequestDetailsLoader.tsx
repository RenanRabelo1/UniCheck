import { useCallback } from "react";
import type { AppTopNavExtras } from "../../components/AppTopNav";
import { RequestDetailsScreen } from "../../components/RequestDetailsScreen";
import { mapRequestDetails } from "../../app/navigation";
import { getRequestDetails } from "../../services/requests";
import { isApiMode } from "../../services/api";
import type { DashboardSession } from "../dashboard/dashboard.types";
import type { MyRequest } from "./types";
import { useRequestData } from "./useRequestData";
export function RequestDetailsLoader({
  selectedRequest,
  session,
  onBack,
  onHome,
  onNewRequest,
  navExtras,
}: {
  selectedRequest: MyRequest | null;
  session: DashboardSession;
  onBack: () => void;
  onHome: () => void;
  onNewRequest: () => void;
  navExtras?: AppTopNavExtras;
}) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      if (!selectedRequest)
        throw new Error("Selecione uma solicitação para ver os detalhes.");
      return isApiMode()
        ? getRequestDetails(selectedRequest.id, signal)
        : mapRequestDetails(selectedRequest, session);
    },
    [selectedRequest, session],
  );
  const { data, error, loading, retry } = useRequestData(load);
  if (loading || error || !data)
    return (
      <main className="dashboard-feedback">
        <button onClick={onBack}>Voltar para minhas solicitações</button>
        {loading ? (
          <p role="status">Carregando detalhes...</p>
        ) : (
          <>
            <p role="alert">{error}</p>
            <button onClick={retry}>Tentar novamente</button>
          </>
        )}
      </main>
    );
  return (
    <RequestDetailsScreen
      request={data}
      onBack={onBack}
      nav={{
        user: session,
        onHome,
        onNewRequest,
        onMyRequests: onBack,
        ...navExtras,
      }}
    />
  );
}

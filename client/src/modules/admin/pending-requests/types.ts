export type PendingRequestResource = "MATERIAL" | "CHAVE";

export type PendingRequestDemoState = "normal" | "loading" | "empty" | "error";

export type PendingRequestPeriod = "today" | "last-7-days" | "month" | "custom";

export interface PendingRequest {
  id: string;
  protocol: string;
  requesterName: string;
  requesterRole: "Professor" | "Professora" | "Aluno";
  resourceType: PendingRequestResource;
  resourceSummary: string;
  requestedAt: string;
  requestedFor: string;
  priority: "Normal" | "Alta";
}

export interface PendingRequestsScreenProps {
  /** Recebe somente o identificador da solicitação escolhida para análise. */
  onAnalyzeRequest?: (requestId: string) => void;
}

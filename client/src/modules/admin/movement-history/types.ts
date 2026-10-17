export type MovementKind =
  | "SOLICITACAO"
  | "RETIRADA"
  | "DEVOLUCAO"
  | "ATRASO"
  | "ADMINISTRACAO";

export type MovementStatus = "CONCLUIDO" | "PENDENTE" | "ATRASADO" | "INATIVO";

export interface MovementRecord {
  id: string;
  protocol: string;
  occurredAt: string;
  kind: MovementKind;
  status: MovementStatus;
  requester: string;
  item: string;
  responsible: string;
  details: string;
}

export interface MovementFilters {
  query: string;
  kind: MovementKind | "";
  status: MovementStatus | "";
  startDate: string;
  endDate: string;
}

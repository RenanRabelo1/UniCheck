import type { AdminRequest } from "../../../services/adminRequests";

export type AdminRequestItem = AdminRequest["items"][number];

export const APPROVED_STATUSES = ["APROVADO", "RESERVADO"];
export const IN_POSSESSION_STATUSES = ["RETIRADO", "ATRASADO"];

/** Mantém só as solicitações que têm algum item na situação pedida, já com os itens filtrados. */
export function filterByItemStatus(
  requests: AdminRequest[] | undefined,
  statuses: string[],
): AdminRequest[] {
  return (requests ?? [])
    .map((request) => ({
      ...request,
      items: request.items.filter((item) => statuses.includes(item.status)),
    }))
    .filter((request) => request.items.length > 0);
}

export function matchesSearch(request: AdminRequest, term: string): boolean {
  const search = term.trim().toLocaleLowerCase("pt-BR");
  if (!search) return true;
  return [
    request.protocol,
    request.requester?.name,
    request.requester?.registration,
    ...request.items.map((item) => item.name),
  ].some((text) => text?.toLocaleLowerCase("pt-BR").includes(search));
}

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));

export const errorMessage = (cause: unknown, fallback: string) =>
  cause instanceof Error ? cause.message : fallback;

import type { MyRequest } from "../components/MyRequestsScreen.mock";
import type {
  RequestDetails,
  RequestItemStatus,
} from "../components/RequestDetailsScreen";
import type { DashboardSession } from "../modules/dashboard/dashboard.types";

export type AdminView =
  | "admin-pending"
  | "admin-analysis"
  | "admin-checkout"
  | "admin-return"
  | "admin-alerts"
  | "admin-materials"
  | "admin-rooms-keys"
  | "admin-authorizations"
  | "admin-history";

export type AppView =
  | "dashboard"
  | "professor-materials"
  | "new-request"
  | "confirmation"
  | "my-requests"
  | "request-details"
  | AdminView;

const requestStatusMap: Record<MyRequest["status"], RequestItemStatus> = {
  "in-possession": "RETIRADO",
  approved: "APROVADO",
  pending: "PENDENTE",
  returned: "DEVOLVIDO",
  rejected: "RECUSADO",
};

export function mapRequestDetails(
  request: MyRequest,
  session: DashboardSession,
): RequestDetails {
  const itemStatus = requestStatusMap[request.status];
  const itemNames = [request.item, request.secondaryItem].filter(
    (item): item is string => Boolean(item),
  );

  return {
    id: request.id,
    protocol: request.protocol,
    statusLabel: request.instruction,
    requester: {
      name: session.name,
      role: session.roleLabel,
      registration: session.registration,
    },
    purpose: "Atividade acadêmica no Centro de Ciências Tecnológicas",
    location: request.destination,
    requestedAt: request.requestedAt,
    period: request.schedule,
    items: itemNames.map((name, index) => ({
      id: `${request.id}-${index}`,
      name,
      description:
        index === 0
          ? "Item principal da solicitação"
          : "Item complementar da solicitação",
      quantity: 1,
      status: itemStatus,
      rejectionReason:
        itemStatus === "RECUSADO" ? request.instruction : undefined,
      pickup:
        itemStatus === "RETIRADO" || itemStatus === "DEVOLVIDO"
          ? { date: request.requestedAt, attendant: "Secretaria CCT" }
          : undefined,
      return:
        itemStatus === "RETIRADO"
          ? { dueDate: request.schedule.split(" - ")[1] ?? "21:00" }
          : itemStatus === "DEVOLVIDO"
            ? {
                dueDate: request.schedule,
                date: request.instruction,
                attendant: "Secretaria CCT",
              }
            : undefined,
    })),
    timeline: [
      {
        id: `${request.id}-current`,
        date: request.requestedAt,
        title: request.instruction,
        description: `Situação atual: ${request.status}.`,
        isNextStep:
          request.status === "approved" || request.status === "in-possession",
      },
      {
        id: `${request.id}-created`,
        date: request.requestedAt,
        title: "Solicitação registrada",
        description: "Pedido enviado pelo portal acadêmico.",
      },
    ],
  };
}

import { z } from "zod";
import { ApiError, getJson } from "./api";
import type { MyRequest, MyRequestStatus } from "../modules/solicitacoes/types";
import type { RequestDetails } from "../components/RequestFlow.types";

const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  detail: z.string().nullable(),
  quantity: z.number(),
  status: z.enum([
    "PENDENTE",
    "APROVADO",
    "RESERVADO",
    "RETIRADO",
    "ATRASADO",
    "DEVOLVIDO",
    "RECUSADO",
  ]),
  statusLabel: z.string(),
  updatedAt: z.string(),
  refusalReason: z.string().nullable(),
});
const requestSchema = z.object({
  id: z.string(),
  protocol: z.string(),
  semester: z.string(),
  createdAt: z.string(),
  date: z.string(),
  room: z.object({ value: z.string(), label: z.string() }),
  pickupTime: z.string(),
  returnTime: z.string(),
  notes: z.string().nullable(),
  items: z.array(itemSchema),
});
const detailSchema = requestSchema.extend({
  requester: z.object({
    name: z.string(),
    registration: z.string(),
    roleLabel: z.string(),
  }),
  movements: z.array(
    z.object({
      id: z.string(),
      itemId: z.string(),
      itemName: z.string(),
      type: z.enum(["RETIRADA", "DEVOLUCAO"]),
      registeredAt: z.string(),
      responsible: z.string(),
      attendant: z.string(),
      notes: z.string().nullable(),
    }),
  ),
});
type RequestDto = z.infer<typeof requestSchema>;
const labels: Record<MyRequestStatus, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  "in-possession": "Em posse",
  returned: "Devolvida",
  rejected: "Recusada",
};
function aggregate(request: RequestDto): MyRequestStatus {
  const statuses = request.items.map((i) => i.status);
  if (statuses.some((s) => s === "RETIRADO" || s === "ATRASADO"))
    return "in-possession";
  if (statuses.includes("PENDENTE")) return "pending";
  if (statuses.some((s) => s === "APROVADO" || s === "RESERVADO"))
    return "approved";
  if (statuses.includes("DEVOLVIDO")) return "returned";
  return "rejected";
}
function statusLabel(request: RequestDto) {
  const summary = request.items.reduce<Record<string, number>>(
    (result, item) => {
      result[item.statusLabel] = (result[item.statusLabel] ?? 0) + 1;
      return result;
    },
    {},
  );
  if (Object.keys(summary).length > 1)
    return Object.entries(summary)
      .map(([label, count]) => `${count} ${label.toLowerCase()}`)
      .join(" · ");
  if (request.items.some((i) => i.status === "ATRASADO")) return "Em atraso";
  return labels[aggregate(request)];
}
const dateTime = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
const dateOnly = (date: string) => date.split("-").reverse().join("/");
function token() {
  const value = sessionStorage.getItem("unicheck_token");
  if (!value)
    throw new ApiError(
      "Entre novamente para consultar suas solicitações.",
      401,
    );
  return value;
}
export async function listRequests(signal?: AbortSignal): Promise<MyRequest[]> {
  const requests = z
    .array(requestSchema)
    .parse(await getJson("/solicitacoes", token(), signal));
  return requests.map((request) => ({
    id: request.id,
    protocol: request.protocol,
    requestedAt: dateTime(request.createdAt),
    period: request.semester,
    item: request.items[0]?.name ?? "Sem itens",
    secondaryItem:
      request.items
        .slice(1)
        .map((i) => `${i.name} (${i.quantity})`)
        .join(" · ") || undefined,
    destination: request.room.label,
    schedule: `${dateOnly(request.date)} · ${request.pickupTime} - ${request.returnTime}`,
    status: aggregate(request),
    instruction: statusLabel(request),
  }));
}
export async function getRequestDetails(
  id: string,
  signal?: AbortSignal,
): Promise<RequestDetails> {
  const request = detailSchema.parse(
    await getJson(`/solicitacoes/${encodeURIComponent(id)}`, token(), signal),
  );
  const timeline = [
    {
      id: `${id}-created`,
      date: request.createdAt,
      title: "Solicitação registrada",
      description: "Pedido registrado no sistema.",
    },
  ];
  for (const item of request.items) {
    // The legacy model retains only the latest status date, not a complete decision audit.
    if (["APROVADO", "RESERVADO", "RECUSADO"].includes(item.status))
      timeline.push({
        id: `${item.id}-decision`,
        date: item.updatedAt,
        title: `${item.name}: ${item.statusLabel}`,
        description:
          item.refusalReason ?? "Situação registrada pela secretaria.",
      });
  }
  for (const movement of request.movements)
    timeline.push({
      id: movement.id,
      date: movement.registeredAt,
      title: `${movement.type === "RETIRADA" ? "Retirada" : "Devolução"}: ${movement.itemName}`,
      description: `Responsável: ${movement.responsible}. Registrado por ${movement.attendant}.${movement.notes ? ` Observação: ${movement.notes}` : ""}`,
    });
  return {
    id: request.id,
    protocol: request.protocol,
    statusLabel: statusLabel(request),
    requester: { ...request.requester, role: request.requester.roleLabel },
    purpose: "Não informada no cadastro da solicitação",
    location: request.room.label,
    requestedAt: dateTime(request.createdAt),
    period: `${dateOnly(request.date)} · ${request.pickupTime} - ${request.returnTime}`,
    notes: request.notes ?? undefined,
    items: request.items.map((item) => {
      const movements = request.movements
        .filter((m) => m.itemId === item.id)
        .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
      const pickup = movements.find((m) => m.type === "RETIRADA");
      const returned = movements.find((m) => m.type === "DEVOLUCAO");
      return {
        id: item.id,
        name: item.name,
        description: item.detail ?? "",
        quantity: item.quantity,
        status: item.status,
        rejectionReason: item.refusalReason ?? undefined,
        pickup: pickup
          ? { date: dateTime(pickup.registeredAt), attendant: pickup.attendant }
          : undefined,
        return: {
          dueDate: `${dateOnly(request.date)} às ${request.returnTime}`,
          date: returned ? dateTime(returned.registeredAt) : undefined,
          attendant: returned?.attendant,
        },
      };
    }),
    timeline: timeline
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((event) => ({ ...event, date: dateTime(event.date) })),
  };
}

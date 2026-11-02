import { z } from "zod";
import { getJson, parseResponse, sessionToken } from "./api";

const alertSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  protocol: z.string(),
  itemId: z.string(),
  itemName: z.string(),
  itemType: z.enum(["key", "material"]),
  room: z.string().nullable(),
  keyType: z.string().nullable(),
  requester: z.string().nullable(),
  registration: z.string().nullable(),
  contact: z.string().nullable(),
  withdrawnAt: z.string().nullable(),
  dueDate: z.string(),
  dueTime: z.string(),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
  status: z.enum(["open", "resolved"]),
});
export type OverdueAlert = z.infer<typeof alertSchema>;
export type AlertStatusFilter = "open" | "resolved" | "all";

export async function listAlerts(
  status: AlertStatusFilter,
  signal?: AbortSignal,
): Promise<OverdueAlert[]> {
  return parseResponse(
    z.array(alertSchema),
    await getJson(`/alertas?status=${status}`, sessionToken(), signal),
  );
}

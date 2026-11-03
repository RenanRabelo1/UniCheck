import { z } from "zod";
import { getJson, parseResponse, sessionToken } from "./api";

const recordSchema = z
  .object({
    at: z.string(),
    by: z.string().nullable(),
    responsible: z.string().nullable(),
    notes: z.string().nullable(),
    condition: z.string().nullish(),
  })
  .nullable();
const historyItemSchema = z.object({
  itemId: z.string(),
  requestId: z.string(),
  protocol: z.string(),
  requester: z.string().nullable(),
  registration: z.string().nullable(),
  itemName: z.string(),
  itemType: z.enum(["key", "material"]),
  room: z.string(),
  status: z.string(),
  statusLabel: z.string(),
  decision: z
    .object({
      at: z.string(),
      by: z.string().nullable(),
      outcome: z.enum(["approved", "refused"]),
      reason: z.string().nullable(),
    })
    .nullable(),
  withdrawal: recordSchema,
  return: recordSchema,
  keyDelivered: z.string().nullish(),
  wasLate: z.boolean(),
});
export type HistoryItem = z.infer<typeof historyItemSchema>;
export type HistoryFilters = {
  search: string;
  material: string;
  room: string;
  status: string;
  from: string;
  to: string;
};

export async function listHistory(
  filters: HistoryFilters,
  signal?: AbortSignal,
): Promise<HistoryItem[]> {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value.trim()),
  ).toString();
  return parseResponse(
    z.array(historyItemSchema),
    await getJson(
      `/movimentacoes/historico${query ? `?${query}` : ""}`,
      sessionToken(),
      signal,
    ),
  );
}

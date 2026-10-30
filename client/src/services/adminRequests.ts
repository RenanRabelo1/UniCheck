import { z } from "zod";
import { ApiError, getJson, postJson } from "./api";
import { requestSchema } from "./requests";

const adminRequestSchema = requestSchema.extend({
  items: z.array(
    requestSchema.shape.items.element.extend({
      type: z.enum(["key", "material"]),
    }),
  ),
  requester: z
    .object({
      name: z.string(),
      registration: z.string(),
      roleLabel: z.string(),
    })
    .nullable(),
});
export type AdminRequest = z.infer<typeof adminRequestSchema>;
export type AdminDecision =
  { decision: "approve" } | { decision: "refuse"; reason: string };

function token() {
  const value = sessionStorage.getItem("unicheck_token");
  if (!value)
    throw new ApiError("Entre novamente para consultar as solicitações.", 401);
  return value;
}
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new ApiError(
      "O servidor retornou dados incompatíveis. Atualize a página e confira a versão do servidor.",
    );
  return result.data;
}
export async function listPendingRequests(
  signal?: AbortSignal,
): Promise<AdminRequest[]> {
  return parse(
    z.array(adminRequestSchema),
    await getJson("/admin/solicitacoes?status=PENDENTE", token(), signal),
  );
}
export async function getAdminRequest(
  id: string,
  signal?: AbortSignal,
): Promise<AdminRequest> {
  return parse(
    adminRequestSchema,
    await getJson(
      `/admin/solicitacoes/${encodeURIComponent(id)}`,
      token(),
      signal,
    ),
  );
}
export async function decideAdminItem(
  requestId: string,
  itemId: string,
  input: AdminDecision,
): Promise<AdminRequest> {
  return parse(
    adminRequestSchema,
    await postJson(
      `/admin/solicitacoes/${encodeURIComponent(requestId)}/itens/${encodeURIComponent(itemId)}/decisao`,
      input,
      token(),
    ),
  );
}

import { z } from "zod";
import { ApiError, postJson } from "./api";

const movementSchema = z.object({
  id: z.string(),
  type: z.enum(["withdrawal", "return"]),
  requestId: z.string(),
  itemId: z.string(),
  itemName: z.string(),
  responsible: z.string(),
  registeredBy: z.string().nullable(),
  registeredAt: z.string(),
  notes: z.string().nullable(),
});
const returnSchema = movementSchema.extend({ wasLate: z.boolean() });

export type Movement = z.infer<typeof movementSchema>;
export type ReturnMovement = z.infer<typeof returnSchema>;

export type WithdrawalInput = {
  requestId: string;
  itemId: string;
  termAccepted: boolean;
  responsibleName?: string;
  notes?: string;
};
export type ReturnInput = {
  requestId: string;
  itemId: string;
  responsibleName?: string;
  notes?: string;
};

function token() {
  const value = sessionStorage.getItem("unicheck_token");
  if (!value)
    throw new ApiError("Entre novamente para registrar a movimentação.", 401);
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

/** Registra a retirada de UM item. O servidor exige o termo aceito; a data da retirada é livre. */
export async function registerWithdrawal(
  input: WithdrawalInput,
): Promise<Movement> {
  return parse(
    movementSchema,
    await postJson("/movimentacoes/retiradas", input, token()),
  );
}

/** Registra a devolução de UM item e resolve o alerta de atraso dele, se houver. */
export async function registerReturn(
  input: ReturnInput,
): Promise<ReturnMovement> {
  return parse(
    returnSchema,
    await postJson("/movimentacoes/devolucoes", input, token()),
  );
}

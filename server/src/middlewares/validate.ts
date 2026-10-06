import type { z } from 'zod'
import { HttpError } from './httpError.js'

/** Valida `data` com o schema do Zod. Se falhar, responde 400 com a primeira mensagem. */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message ?? 'Dados inválidos.')
  }
  return result.data
}

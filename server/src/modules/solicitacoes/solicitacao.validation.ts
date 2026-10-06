import { z } from 'zod'
import { isRealDate } from '../../utils/dates.js'
import { TODOS_STATUS } from './solicitacao.status.js'

export const dateSchema = z
  .string({ error: 'Informe a data de utilização.' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Use o formato AAAA-MM-DD.')
  .refine(isRealDate, 'Data inválida.')

export const timeSchema = z
  .string({ error: 'Informe o horário.' })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido. Use o formato HH:mm.')

export const createSolicitacaoSchema = z.object({
  date: dateSchema,
  room: z.string({ error: 'Informe a sala.' }).min(1, 'Informe a sala.'),
  pickupTime: timeSchema,
  returnTime: timeSchema,
  notes: z.string().trim().max(500, 'As observações aceitam até 500 caracteres.').optional(),
  items: z
    .array(
      z.object({
        id: z.string({ error: 'Informe o item.' }).min(1, 'Informe o item.'),
        quantity: z
          .number({ error: 'Quantidade inválida.' })
          .int('Quantidade inválida.')
          .min(1, 'A quantidade mínima é 1.')
          .max(10, 'A quantidade máxima é 10.')
          .default(1),
      }),
      { error: 'Informe ao menos um item.' },
    )
    .min(1, 'Informe ao menos um item.')
    .max(10, 'Uma solicitação aceita no máximo 10 itens.'),
})

export type CreateSolicitacaoInput = z.infer<typeof createSolicitacaoSchema>

// Na consulta de opções, a janela é opcional (serve só para mostrar disponibilidade).
export const optionsQuerySchema = z.object({
  date: dateSchema.optional(),
  pickupTime: timeSchema.optional(),
  returnTime: timeSchema.optional(),
})

// ---- Análise do coordenador ----

export const decisionSchema = z
  .object({
    decision: z.enum(['approve', 'refuse'], { error: 'Decisão inválida. Use "approve" ou "refuse".' }),
    reason: z.string().trim().max(300, 'O motivo aceita até 300 caracteres.').optional(),
  })
  // Regra do docs: toda recusa precisa de motivo.
  .refine((data) => data.decision !== 'refuse' || Boolean(data.reason), {
    message: 'Toda recusa precisa de motivo.',
    path: ['reason'],
  })

export type DecisionInput = z.infer<typeof decisionSchema>

export const adminListQuerySchema = z.object({
  status: z.enum(TODOS_STATUS, { error: 'Status inválido.' }).optional(),
  date: dateSchema.optional(),
})

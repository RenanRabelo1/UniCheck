import { z } from 'zod'

const TERMO = 'É necessário o aceite do termo de responsabilidade.'

const idSchema = (message: string) => z.string({ error: message }).min(1, message)

export const retiradaSchema = z.object({
  requestId: idSchema('Informe a solicitação.'),
  itemId: idSchema('Informe o item.'),
  // Regra do docs: a retirada exige o aceite do termo de responsabilidade.
  termAccepted: z.boolean({ error: TERMO }).refine((aceito) => aceito, TERMO),
  /** Quem está retirando. Se não vier, assume o solicitante. */
  responsibleName: z.string().trim().max(100, 'O nome aceita até 100 caracteres.').optional(),
  notes: z.string().trim().max(300, 'As observações aceitam até 300 caracteres.').optional(),
})

export const devolucaoSchema = z.object({
  requestId: idSchema('Informe a solicitação.'),
  itemId: idSchema('Informe o item.'),
  responsibleName: z.string().trim().max(100, 'O nome aceita até 100 caracteres.').optional(),
  notes: z.string().trim().max(300, 'As observações aceitam até 300 caracteres.').optional(),
})

export const movimentacaoQuerySchema = z.object({
  requestId: z.string().optional(),
  itemId: z.string().optional(),
})

export type RetiradaInput = z.infer<typeof retiradaSchema>
export type DevolucaoInput = z.infer<typeof devolucaoSchema>

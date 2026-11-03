import { z } from 'zod'
import { isRealDate } from '../../utils/dates.js'
import { TODOS_STATUS } from '../solicitacoes/solicitacao.status.js'

const TERMO = 'É necessário o aceite do termo de responsabilidade.'

const idSchema = (message: string) => z.string({ error: message }).min(1, message)

export const retiradaSchema = z.object({
  requestId: idSchema('Informe a solicitação.'),
  itemId: idSchema('Informe o item.'),
  // Regra do docs: a retirada exige o aceite do termo de responsabilidade.
  termAccepted: z.boolean({ error: TERMO }).refine((aceito) => aceito, TERMO),
  /** Chave física entregue. Obrigatória quando o item é uma chave (conferido no service). */
  keyId: z.string().min(1, 'Selecione a chave entregue.').optional(),
  /** Quem está retirando. Se não vier, assume o solicitante. */
  responsibleName: z.string().trim().max(100, 'O nome aceita até 100 caracteres.').optional(),
  notes: z.string().trim().max(300, 'As observações aceitam até 300 caracteres.').optional(),
})

export const devolucaoSchema = z.object({
  requestId: idSchema('Informe a solicitação.'),
  itemId: idSchema('Informe o item.'),
  condition: z.enum(['INTEGRO', 'AVARIADO', 'INCOMPLETO'], { error: 'Informe a condição de devolução.' }),
  responsibleName: z.string().trim().max(100, 'O nome aceita até 100 caracteres.').optional(),
  notes: z.string().trim().max(300, 'As observações aceitam até 300 caracteres.').optional(),
})

export const movimentacaoQuerySchema = z.object({
  requestId: z.string().optional(),
  itemId: z.string().optional(),
})

const dateFilter = (message: string) =>
  z
    .string()
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && isRealDate(value), message)
    .optional()

const textFilter = z.string().trim().max(100, 'A pesquisa aceita até 100 caracteres.').optional()

export const historicoQuerySchema = z
  .object({
    search: textFilter,
    material: textFilter,
    room: textFilter,
    status: z.enum(TODOS_STATUS, { error: 'Status inválido.' }).optional(),
    from: dateFilter('Data inicial inválida.'),
    to: dateFilter('Data final inválida.'),
  })
  .refine((data) => !data.from || !data.to || data.from <= data.to, {
    message: 'A data inicial não pode ser posterior à data final.',
  })

export type RetiradaInput = z.infer<typeof retiradaSchema>
export type DevolucaoInput = z.infer<typeof devolucaoSchema>

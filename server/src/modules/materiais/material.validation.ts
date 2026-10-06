import { z } from 'zod'

const nameSchema = z
  .string({ error: 'Informe o nome do material.' })
  .trim()
  .min(2, 'O nome precisa ter ao menos 2 caracteres.')
  .max(100, 'O nome aceita até 100 caracteres.')

// Patrimônio, bancada... Texto vazio limpa o campo.
const detailSchema = z.string().trim().max(100, 'O detalhe aceita até 100 caracteres.')

const quantitySchema = z
  .number({ error: 'Informe a quantidade total.' })
  .int('A quantidade total deve ser um número inteiro.')
  .min(1, 'A quantidade total mínima é 1.')
  .max(1000, 'A quantidade total máxima é 1000.')

export const createMaterialSchema = z.object({
  name: nameSchema,
  detail: detailSchema.optional(),
  totalQuantity: quantitySchema,
})

export const updateMaterialSchema = z
  .object({
    name: nameSchema.optional(),
    detail: detailSchema.optional(),
    totalQuantity: quantitySchema.optional(),
    active: z.boolean({ error: 'O campo active deve ser verdadeiro ou falso.' }).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo para alterar.',
  })

export const listMaterialQuerySchema = z.object({
  active: z.enum(['true', 'false'], { error: 'Use active=true ou active=false.' }).optional(),
})

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>

import { z } from 'zod'

const codeSchema = z
  .string({ error: 'Informe o código da sala.' })
  .trim()
  .regex(/^[A-Za-z0-9-]{2,10}$/, 'O código da sala deve ter de 2 a 10 letras, números ou hífens (ex.: J-205).')

const nameSchema = z
  .string({ error: 'Informe o nome da sala.' })
  .trim()
  .min(2, 'O nome precisa ter ao menos 2 caracteres.')
  .max(100, 'O nome aceita até 100 caracteres.')

export const createSalaSchema = z.object({ code: codeSchema, name: nameSchema })

export const updateSalaSchema = z
  .object({
    code: codeSchema.optional(),
    name: nameSchema.optional(),
    active: z.boolean({ error: 'O campo active deve ser verdadeiro ou falso.' }).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Informe ao menos um campo para alterar.',
  })

export const createChaveSchema = z.object({
  roomId: z.string({ error: 'Informe a sala.' }).min(1, 'Informe a sala.'),
  type: z.enum(['primary', 'secondary'], { error: 'O tipo da chave deve ser "primary" ou "secondary".' }),
})

// De uma chave só se altera se está ativa: sala e tipo são a identidade dela.
export const updateChaveSchema = z.object({
  active: z.boolean({ error: 'Informe active como verdadeiro ou falso.' }),
})

export type CreateSalaInput = z.infer<typeof createSalaSchema>
export type UpdateSalaInput = z.infer<typeof updateSalaSchema>
export type CreateChaveInput = z.infer<typeof createChaveSchema>
export type UpdateChaveInput = z.infer<typeof updateChaveSchema>

import { z } from 'zod'

const nameSchema = z
  .string({ error: 'Informe o nome do material.' })
  .trim()
  .min(2, 'O nome precisa ter ao menos 2 caracteres.')
  .max(100, 'O nome aceita até 100 caracteres.')

// Patrimônio, bancada... Texto vazio limpa o campo.
const detailSchema = z.string().trim().max(100, 'O detalhe aceita até 100 caracteres.')

const categorySchema = z
  .string({ error: 'Informe a categoria.' })
  .trim()
  .min(2, 'A categoria precisa ter ao menos 2 caracteres.')
  .max(100, 'A categoria aceita até 100 caracteres.')

const patrimonySchema = z.string().trim().max(60, 'O patrimônio aceita até 60 caracteres.')

const quantitySchema = z
  .number({ error: 'Informe a quantidade total.' })
  .int('A quantidade total deve ser um número inteiro.')
  .min(1, 'A quantidade total mínima é 1.')
  .max(1000, 'A quantidade total máxima é 1000.')

export const createMaterialSchema = z
  .object({
    name: nameSchema,
    category: categorySchema.default('Geral'),
    control: z.enum(['individual', 'quantity'], { error: 'Escolha o controle individual ou por quantidade.' }).default('quantity'),
    patrimony: patrimonySchema.optional(),
    detail: detailSchema.optional(),
    totalQuantity: quantitySchema,
  })
  // Mesma regra do CHECK ck_material_controle do banco, com mensagem para a tela.
  .superRefine((data, ctx) => {
    if (data.control === 'individual') {
      if (!data.patrimony) ctx.addIssue({ code: 'custom', path: ['patrimony'], message: 'Informe o patrimônio do material individual.' })
      if (data.totalQuantity !== 1) ctx.addIssue({ code: 'custom', path: ['totalQuantity'], message: 'Material individual tem uma única unidade.' })
    } else if (data.patrimony) {
      ctx.addIssue({ code: 'custom', path: ['patrimony'], message: 'Material por quantidade não tem patrimônio.' })
    }
  })

export const updateMaterialSchema = z
  .object({
    name: nameSchema.optional(),
    category: categorySchema.optional(),
    patrimony: patrimonySchema.optional(),
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

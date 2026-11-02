import { z } from 'zod'

const idSchema = (message: string) => z.string({ error: message }).min(1, message)

export const createProjetoSchema = z.object({
  name: z
    .string({ error: 'Informe o nome do projeto.' })
    .trim()
    .min(2, 'O nome precisa ter ao menos 2 caracteres.')
    .max(150, 'O nome aceita até 150 caracteres.'),
  description: z.string().trim().max(500, 'A descrição aceita até 500 caracteres.').optional(),
  professorId: idSchema('Informe o professor responsável.'),
})

export const createAutorizacaoSchema = z.object({
  studentId: idSchema('Informe o aluno.'),
  projectId: idSchema('Informe o projeto.'),
})

// Projetos e autorizações só mudam de situação: nada é removido.
export const updateAtivoSchema = z.object({
  active: z.boolean({ error: 'Informe active como verdadeiro ou falso.' }),
})

export type CreateProjetoInput = z.infer<typeof createProjetoSchema>
export type CreateAutorizacaoInput = z.infer<typeof createAutorizacaoSchema>

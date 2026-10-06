import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z.string({ error: 'Informe matrícula ou e-mail.' }).trim().min(1, 'Informe matrícula ou e-mail.'),
  password: z.string({ error: 'Informe sua senha.' }).min(1, 'Informe sua senha.'),
  // Perfil escolhido na aba da tela de login. É apenas conferido, nunca confiado.
  role: z.enum(['professor', 'student', 'coordinator', 'staff']).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>

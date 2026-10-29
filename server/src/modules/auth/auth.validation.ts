import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z.string({ error: 'Informe e-mail institucional ou matrícula.' }).trim().min(1, 'Informe e-mail institucional ou matrícula.'),
  password: z.string({ error: 'Informe sua senha.' }).min(1, 'Informe sua senha.'),
  // Perfil escolhido na aba da tela de login. É apenas conferido, nunca confiado.
  role: z.enum(['professor', 'student', 'coordinator', 'staff']).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>

/** Lista o que falta na senha: mínimo de 8 caracteres, 1 letra maiúscula e 1 caractere especial. */
export function missingPasswordRules(password: string): string[] {
  const missing: string[] = []
  if (password.length < 8) missing.push('no mínimo 8 caracteres')
  if (!/\p{Lu}/u.test(password)) missing.push('1 letra maiúscula')
  if (!/[^\p{L}\p{N}\s]/u.test(password)) missing.push('1 caractere especial')
  return missing
}

/** "a", "a e b" ou "a, b e c". */
function joinList(items: string[]): string {
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} e ${items.at(-1)}` : (items[0] ?? '')
}

export function passwordRulesMessage(password: string): string | undefined {
  const missing = missingPasswordRules(password)
  return missing.length ? `A senha precisa ter ${joinList(missing)}.` : undefined
}

/** Perfis que podem se cadastrar pela tela pública (mesmos nomes usados no login). */
export const registerRoles = ['professor', 'student', 'coordinator'] as const

export const registerSchema = z.object({
  role: z.enum(registerRoles, { error: 'Escolha o perfil.' }),
  name: z
    .string({ error: 'Informe seu nome.' })
    .trim()
    .min(3, 'Informe seu nome completo.')
    .max(150, 'O nome deve ter no máximo 150 caracteres.'),
  email: z
    .string({ error: 'Informe seu e-mail institucional.' })
    .trim()
    .toLowerCase()
    .max(150, 'O e-mail deve ter no máximo 150 caracteres.')
    .pipe(z.email('Informe um e-mail válido.')),
  registration: z
    .string({ error: 'Informe sua matrícula.' })
    .trim()
    .min(3, 'Informe sua matrícula.')
    .max(30, 'A matrícula deve ter no máximo 30 caracteres.'),
  phone: z
    .string()
    .trim()
    .max(30, 'O contato deve ter no máximo 30 caracteres.')
    .optional()
    .transform((value) => value || undefined),
  // Curso (aluno), área/departamento (professor) ou setor (coordenador).
  detail: z
    .string({ error: 'Preencha este campo.' })
    .trim()
    .min(2, 'Preencha este campo.')
    .max(255, 'O texto deve ter no máximo 255 caracteres.'),
  password: z
    .string({ error: 'Informe uma senha.' })
    // O bcrypt só considera os primeiros 72 bytes da senha.
    .max(72, 'A senha deve ter no máximo 72 caracteres.')
    .superRefine((value, ctx) => {
      const message = passwordRulesMessage(value)
      if (message) ctx.addIssue({ code: 'custom', message })
    }),
})

export type RegisterInput = z.infer<typeof registerSchema>

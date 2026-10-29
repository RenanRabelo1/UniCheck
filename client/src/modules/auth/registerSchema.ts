import { z } from "zod";

/** Lista o que falta na senha: mínimo de 8 caracteres, 1 letra maiúscula e 1 caractere especial. */
export function missingPasswordRules(password: string): string[] {
  const missing: string[] = [];
  if (password.length < 8) missing.push("no mínimo 8 caracteres");
  if (!/\p{Lu}/u.test(password)) missing.push("1 letra maiúscula");
  if (!/[^\p{L}\p{N}\s]/u.test(password)) missing.push("1 caractere especial");
  return missing;
}

/** "a", "a e b" ou "a, b e c". */
function joinList(items: string[]): string {
  return items.length > 1 ? `${items.slice(0, -1).join(", ")} e ${items.at(-1)}` : (items[0] ?? "");
}

export function passwordRulesMessage(password: string): string | undefined {
  const missing = missingPasswordRules(password);
  return missing.length ? `A senha precisa ter ${joinList(missing)}.` : undefined;
}

/** Regras do formulário de cadastro. O servidor repete a validação (nunca confie só no front). */
export const registerFormSchema = z
  .object({
    role: z.enum(["professor", "student", "coordinator"]),
    name: z.string().trim().min(3, "Informe seu nome completo."),
    email: z.string().trim().pipe(z.email("Informe um e-mail válido.")),
    registration: z.string().trim().min(3, "Informe sua matrícula."),
    phone: z.string().trim().max(30, "No máximo 30 caracteres."),
    detail: z.string().trim().min(2, "Preencha este campo."),
    password: z
      .string()
      .max(72, "A senha deve ter no máximo 72 caracteres.")
      .superRefine((value, ctx) => {
        const message = passwordRulesMessage(value);
        if (message) ctx.addIssue({ code: "custom", message });
      }),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

/** Texto do campo que muda de acordo com o perfil escolhido. */
export const detailFieldByRole: Record<
  RegisterFormValues["role"],
  { label: string; placeholder: string }
> = {
  student: { label: "Curso", placeholder: "Ex.: Ciência da Computação" },
  professor: {
    label: "Área / Departamento",
    placeholder: "Ex.: Computação e Redes",
  },
  coordinator: {
    label: "Setor / Cargo",
    placeholder: "Ex.: Coordenação do CCT",
  },
};

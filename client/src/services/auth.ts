import { z } from "zod";
import { getJson, postJson } from "./api";
import type { DemoRole, DemoSession } from "../modules/auth/demoSession";

const userSchema = z.object({
  name: z.string(),
  registration: z.string(),
  role: z.enum(["professor", "student", "coordinator"]),
  roleLabel: z.string(),
});
const schema = z.object({ token: z.string().min(1), user: userSchema });

type SessionUser = z.infer<typeof userSchema>;

function toSession(user: SessionUser): DemoSession {
  if (user.role === "coordinator")
    return {
      role: user.role,
      dashboard: { ...user, role: user.role, location: "Secretaria CCT J-02" },
    };
  return { role: user.role, dashboard: { ...user, role: user.role } };
}

export async function loginApi(
  identifier: string,
  password: string,
  role: DemoRole,
): Promise<DemoSession> {
  sessionStorage.removeItem("unicheck_token");
  const { token, user } = schema.parse(
    await postJson("/auth/login", { identifier, password, role }),
  );
  sessionStorage.setItem("unicheck_token", token);
  return toSession(user);
}

/** Reabre a sessão guardada ao recarregar a página. Sem token válido, volta ao login. */
export async function restoreSession(token: string): Promise<DemoSession> {
  return toSession(userSchema.parse(await getJson("/auth/me", token)));
}

/** Invalida o token no servidor. Se a rede falhar, a sessão ainda é encerrada neste navegador. */
export async function logoutApi(token: string): Promise<void> {
  await postJson("/auth/logout", {}, token).catch(() => undefined);
}

export type RegisterData = {
  role: DemoRole;
  name: string;
  email: string;
  registration: string;
  phone?: string;
  /** Curso (aluno), área/departamento (professor) ou setor (coordenador). */
  detail: string;
  password: string;
};

/** Cria a conta no servidor. A conta fica ativa na hora, então a resposta já traz a sessão. */
export async function registerApi(data: RegisterData): Promise<DemoSession> {
  sessionStorage.removeItem("unicheck_token");
  const { token, user } = schema.parse(await postJson("/auth/register", data));
  sessionStorage.setItem("unicheck_token", token);
  return toSession(user);
}

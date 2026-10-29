import { z } from "zod";
import { postJson } from "./api";
import type { DemoRole, DemoSession } from "../modules/auth/demoSession";

const schema = z.object({
  token: z.string().min(1),
  user: z.object({
    name: z.string(),
    registration: z.string(),
    role: z.enum(["professor", "student", "coordinator"]),
    roleLabel: z.string(),
  }),
});

type SessionUser = z.infer<typeof schema>["user"];

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

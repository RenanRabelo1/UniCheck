import type { AdminSession } from "../../components/AdminDashboard.types";
import type { DashboardSession } from "../dashboard/dashboard.types";

export type DemoRole = "professor" | "student" | "coordinator";

export type DemoRoleOption = {
  id: DemoRole;
  label: string;
  accessLabel: string;
};

export type QuickAccess = {
  label: string;
  identifier: string;
  role: DemoRole;
};

export type DemoSession =
  | {
      role: "professor" | "student";
      dashboard: DashboardSession;
    }
  | {
      role: "coordinator";
      dashboard: AdminSession;
    };

export const demoRoles: DemoRoleOption[] = [
  { id: "professor", label: "Professor", accessLabel: "Acesso do professor" },
  { id: "student", label: "Aluno", accessLabel: "Acesso do aluno" },
  {
    id: "coordinator",
    label: "Coordenador CCT",
    accessLabel: "Acesso do coordenador",
  },
];

export const quickAccess: QuickAccess[] = [
  {
    label: "Prof. Ricardo Mendes",
    identifier: "2048819",
    role: "professor",
  },
  {
    label: "Aluno Autorizado",
    identifier: "aluno.autorizado@unifor.br",
    role: "student",
  },
  {
    label: "Coordenador CCT",
    identifier: "18024900",
    role: "coordinator",
  },
  {
    label: "Aluno s/ Autorização",
    identifier: "aluno.naoautorizado@unifor.br",
    role: "student",
  },
];

export function createDemoSession(
  role: DemoRole,
  identifier: string,
): DemoSession {
  if (role === "coordinator") {
    return {
      role,
      dashboard: {
        name: "Marcos Silva",
        registration: identifier,
        role,
        roleLabel: "Coordenador CCT",
        location: "Secretaria CCT J-02",
      },
    };
  }

  const isStudent = role === "student";

  return {
    role,
    dashboard: {
      name: isStudent ? "Lucas Almeida" : "Prof. Ricardo Mendes",
      registration: isStudent ? "aluno.autorizado@unifor.br" : "2048819/CCT",
      role,
      roleLabel: isStudent ? "Aluno autorizado" : "Professor",
    },
  };
}

const registeredRoleLabels: Record<DemoRole, string> = {
  professor: "Professor",
  student: "Aluno",
  coordinator: "Coordenador CCT",
};

/** Modo demonstração (sem API): "cadastra" a pessoa só na memória, com os dados digitados. */
export function createRegisteredSession(data: {
  role: DemoRole;
  name: string;
  registration: string;
}): DemoSession {
  const user = {
    name: data.name,
    registration: data.registration,
    roleLabel: registeredRoleLabels[data.role],
  };
  if (data.role === "coordinator") {
    return {
      role: data.role,
      dashboard: { ...user, role: data.role, location: "Secretaria CCT J-02" },
    };
  }
  return { role: data.role, dashboard: { ...user, role: data.role } };
}

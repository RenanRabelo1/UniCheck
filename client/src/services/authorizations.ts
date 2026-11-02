import { z } from "zod";
import {
  getJson,
  parseResponse,
  patchJson,
  postJson,
  sessionToken,
} from "./api";

const personSchema = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean(),
});
const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  professor: personSchema,
  active: z.boolean(),
});
const authorizationSchema = z.object({
  id: z.string(),
  student: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    registration: z.string(),
  }),
  project: personSchema,
  professor: personSchema,
  coordinator: z.string(),
  authorizedAt: z.string(),
  inactivatedAt: z.string().nullable(),
  active: z.boolean(),
  canRequestKey: z.boolean(),
});
const optionsSchema = z.object({
  students: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      registration: z.string(),
      email: z.string(),
    }),
  ),
  professors: z.array(
    z.object({ id: z.string(), name: z.string(), registration: z.string() }),
  ),
});

export type Project = z.infer<typeof projectSchema>;
export type Authorization = z.infer<typeof authorizationSchema>;
export type AuthorizationOptions = z.infer<typeof optionsSchema>;
export type AuthorizationsData = {
  projects: Project[];
  authorizations: Authorization[];
  options: AuthorizationOptions;
};

export async function loadAuthorizations(
  signal?: AbortSignal,
): Promise<AuthorizationsData> {
  const [projects, authorizations, options] = await Promise.all([
    getJson("/admin/projetos", sessionToken(), signal),
    getJson("/admin/autorizacoes", sessionToken(), signal),
    getJson("/admin/autorizacoes/opcoes", sessionToken(), signal),
  ]);
  return {
    projects: parseResponse(z.array(projectSchema), projects),
    authorizations: parseResponse(z.array(authorizationSchema), authorizations),
    options: parseResponse(optionsSchema, options),
  };
}

export async function createProject(input: {
  name: string;
  description?: string;
  professorId: string;
}): Promise<Project> {
  return parseResponse(
    projectSchema,
    await postJson("/admin/projetos", input, sessionToken()),
  );
}

export async function setProjectActive(
  id: string,
  active: boolean,
): Promise<Project> {
  return parseResponse(
    projectSchema,
    await patchJson(`/admin/projetos/${id}`, { active }, sessionToken()),
  );
}

export async function createAuthorization(input: {
  studentId: string;
  projectId: string;
}): Promise<Authorization> {
  return parseResponse(
    authorizationSchema,
    await postJson("/admin/autorizacoes", input, sessionToken()),
  );
}

export async function setAuthorizationActive(
  id: string,
  active: boolean,
): Promise<Authorization> {
  return parseResponse(
    authorizationSchema,
    await patchJson(`/admin/autorizacoes/${id}`, { active }, sessionToken()),
  );
}

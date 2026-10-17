export type ProjectState = 'ATIVO' | 'INATIVO';
export type AuthorizationState = 'ATIVA' | 'INATIVA';

export interface Project {
  id: string;
  name: string;
  code: string;
  professor: string;
  professorActive: boolean;
  state: ProjectState;
  updatedAt: string;
}

export interface StudentAuthorization {
  id: string;
  student: string;
  registration: string;
  projectId: string;
  state: AuthorizationState;
  createdAt: string;
  updatedAt: string;
  history: AuthorizationHistoryEntry[];
}

export interface AuthorizationHistoryEntry {
  id: string;
  action: string;
  date: string;
}

export interface AuthorizationProjectsSnapshot {
  projects: Project[];
  authorizations: StudentAuthorization[];
}

export interface AuthorizationsProjectsProps {
  onStateChange?: (snapshot: AuthorizationProjectsSnapshot) => void;
}

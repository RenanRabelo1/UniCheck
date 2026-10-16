import type { Project, StudentAuthorization } from './types';

export const initialProjects: Project[] = [
  {
    id: 'project-robotica',
    name: 'Robótica Educacional',
    code: 'ROB-2026',
    professor: 'Profa. Marina Alves',
    professorActive: true,
    state: 'ATIVO',
    updatedAt: '16/10/2026',
  },
  {
    id: 'project-laboratorio',
    name: 'Laboratório de Redes',
    code: 'RED-2026',
    professor: 'Prof. Lucas Mendes',
    professorActive: true,
    state: 'ATIVO',
    updatedAt: '14/10/2026',
  },
  {
    id: 'project-ciencia',
    name: 'Ciência em Movimento',
    code: 'CIM-2026',
    professor: 'Profa. Renata Costa',
    professorActive: false,
    state: 'ATIVO',
    updatedAt: '08/10/2026',
  },
  {
    id: 'project-prototipos',
    name: 'Oficina de Protótipos',
    code: 'OFP-2025',
    professor: 'Prof. Daniel Lima',
    professorActive: true,
    state: 'INATIVO',
    updatedAt: '30/09/2026',
  },
];

export const initialAuthorizations: StudentAuthorization[] = [
  {
    id: 'auth-ana',
    student: 'Ana Beatriz Souza',
    registration: '23104567',
    projectId: 'project-robotica',
    state: 'ATIVA',
    createdAt: '02/10/2026',
    updatedAt: '02/10/2026',
    history: [
      { id: 'history-ana-created', action: 'Autorização criada', date: '02/10/2026' },
    ],
  },
  {
    id: 'auth-carlos',
    student: 'Carlos Eduardo Lima',
    registration: '23107892',
    projectId: 'project-laboratorio',
    state: 'ATIVA',
    createdAt: '21/09/2026',
    updatedAt: '12/10/2026',
    history: [
      { id: 'history-carlos-created', action: 'Autorização criada', date: '21/09/2026' },
      { id: 'history-carlos-edited', action: 'Projeto alterado para Laboratório de Redes', date: '12/10/2026' },
    ],
  },
  {
    id: 'auth-julia',
    student: 'Júlia Martins',
    registration: '22100431',
    projectId: 'project-ciencia',
    state: 'ATIVA',
    createdAt: '15/08/2026',
    updatedAt: '15/08/2026',
    history: [
      { id: 'history-julia-created', action: 'Autorização criada', date: '15/08/2026' },
    ],
  },
  {
    id: 'auth-pedro',
    student: 'Pedro Henrique Ramos',
    registration: '21109874',
    projectId: 'project-prototipos',
    state: 'INATIVA',
    createdAt: '03/04/2026',
    updatedAt: '01/10/2026',
    history: [
      { id: 'history-pedro-created', action: 'Autorização criada', date: '03/04/2026' },
      { id: 'history-pedro-disabled', action: 'Autorização inativada', date: '01/10/2026' },
    ],
  },
];

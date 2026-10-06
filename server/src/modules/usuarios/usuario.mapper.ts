import type { Perfil, Usuario } from '../../database/types.js'

export type PerfilApi = 'professor' | 'student' | 'coordinator' | 'staff'

export type UsuarioSessao = {
  name: string
  registration: string
  role: PerfilApi
  roleLabel: string
  authorized: boolean
}

const perfilParaApi: Record<Perfil, PerfilApi> = {
  PROFESSOR: 'professor',
  ALUNO: 'student',
  COORDENADOR: 'coordinator',
  FUNCIONARIO: 'staff',
}

export function toPerfilApi(perfil: Perfil): PerfilApi {
  return perfilParaApi[perfil]
}

function roleLabel(usuario: Usuario): string {
  if (usuario.perfil === 'PROFESSOR') return 'Professor'
  if (usuario.perfil === 'COORDENADOR') return 'Coordenador CCT'
  if (usuario.perfil === 'FUNCIONARIO') return 'Funcionário da Secretaria'
  return usuario.autorizado ? 'Aluno autorizado' : 'Aluno'
}

/** Formato de usuário que o front-end já espera (DashboardSession). */
export function toUsuarioSessao(usuario: Usuario): UsuarioSessao {
  return {
    name: usuario.nome,
    registration: usuario.matricula,
    role: toPerfilApi(usuario.perfil),
    roleLabel: roleLabel(usuario),
    authorized: usuario.autorizado,
  }
}

/** Dados mínimos de quem fez a solicitação, para as telas administrativas. */
export function toRequester(usuario: Usuario | undefined) {
  if (!usuario) return null
  const { name, registration, role, roleLabel } = toUsuarioSessao(usuario)
  return { name, registration, role, roleLabel }
}

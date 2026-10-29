import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { config } from '../../config.js'
import type { Usuario } from '../../database/types.js'
import { HttpError } from '../../middlewares/httpError.js'
import { usuarioRepository, type PerfilCadastro } from '../usuarios/usuario.repository.js'
import { toPerfilApi, toUsuarioSessao } from '../usuarios/usuario.mapper.js'
import type { LoginInput, RegisterInput } from './auth.validation.js'

// Hash descartável: mantém o tempo de resposta parecido quando o usuário não existe.
const DUMMY_HASH = bcrypt.hashSync('unicheck-dummy', 10)

const perfilDoCadastro: Record<RegisterInput['role'], PerfilCadastro> = {
  professor: 'PROFESSOR',
  student: 'ALUNO',
  coordinator: 'COORDENADOR',
}

const perfilLabel: Record<Usuario['perfil'], string> = {
  PROFESSOR: 'Professor',
  ALUNO: 'Aluno',
  COORDENADOR: 'Coordenador CCT',
  FUNCIONARIO: 'Funcionário',
}

/** Resposta de login e de cadastro: o token e o usuário no formato que o front-end espera. */
function startSession(usuario: Usuario) {
  const token = jwt.sign({ role: usuario.perfil }, config.jwtSecret, {
    subject: usuario.id,
    expiresIn: config.jwtExpiresIn,
    algorithm: 'HS256',
  })

  return { token, user: toUsuarioSessao(usuario) }
}

export const authService = {
  async login({ identifier, password, role }: LoginInput) {
    const usuario = await usuarioRepository.findByIdentificador(identifier)
    const passwordMatches = await bcrypt.compare(password, usuario?.senhaHash ?? DUMMY_HASH)

    if (!usuario || !usuario.ativo || !passwordMatches) {
      throw new HttpError(401, 'Credenciais inválidas.')
    }

    // Senha certa, mas aba de perfil errada na tela de login: avisa qual aba usar.
    if (role !== undefined && toPerfilApi(usuario.perfil) !== role) {
      throw new HttpError(401, `Este acesso é de outro perfil. Selecione a aba "${perfilLabel[usuario.perfil]}".`)
    }

    return startSession(usuario)
  },

  /** Cria a conta (ativa na hora) e já devolve a sessão, como se a pessoa tivesse feito login. */
  async register(input: RegisterInput) {
    // Conferência amigável antes de gravar. A garantia de verdade são as colunas UNIQUE do banco.
    if (await usuarioRepository.findByIdentificador(input.email)) throw new HttpError(409, 'E-mail já cadastrado.')
    if (await usuarioRepository.findByIdentificador(input.registration)) throw new HttpError(409, 'Matrícula já cadastrada.')

    const usuario = await usuarioRepository.create({
      nome: input.name,
      email: input.email,
      matricula: input.registration,
      contato: input.phone,
      perfil: perfilDoCadastro[input.role],
      detalhe: input.detail,
      senhaHash: await bcrypt.hash(input.password, 10),
    })

    return startSession(usuario)
  },
}

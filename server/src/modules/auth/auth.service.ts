import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { config } from '../../config.js'
import { HttpError } from '../../middlewares/httpError.js'
import { usuarioRepository } from '../usuarios/usuario.repository.js'
import { toPerfilApi, toUsuarioSessao } from '../usuarios/usuario.mapper.js'
import type { LoginInput } from './auth.validation.js'

// Hash descartável: mantém o tempo de resposta parecido quando o usuário não existe.
const DUMMY_HASH = bcrypt.hashSync('unicheck-dummy', 10)

export const authService = {
  async login({ identifier, password, role }: LoginInput) {
    const usuario = await usuarioRepository.findByIdentificador(identifier)
    const passwordMatches = await bcrypt.compare(password, usuario?.senhaHash ?? DUMMY_HASH)

    const invalid =
      !usuario || !usuario.ativo || !passwordMatches || (role !== undefined && toPerfilApi(usuario.perfil) !== role)
    if (invalid) {
      throw new HttpError(401, 'Credenciais inválidas.')
    }

    const token = jwt.sign({ role: usuario.perfil }, config.jwtSecret, {
      subject: usuario.id,
      expiresIn: config.jwtExpiresIn,
      algorithm: 'HS256',
    })

    return { token, user: toUsuarioSessao(usuario) }
  },
}

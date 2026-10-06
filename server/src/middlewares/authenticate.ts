import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import type { Perfil, Usuario } from '../database/types.js'
import { usuarioRepository } from '../modules/usuarios/usuario.repository.js'
import { HttpError } from './httpError.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { usuario: Usuario }
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Autenticação necessária.')
  }

  let subject: string | undefined
  try {
    const payload = jwt.verify(header.slice('Bearer '.length), config.jwtSecret, { algorithms: ['HS256'] })
    subject = typeof payload === 'object' ? payload.sub : undefined
  } catch {
    throw new HttpError(401, 'Sessão inválida ou expirada.')
  }

  const usuario = subject ? await usuarioRepository.findById(subject) : undefined
  if (!usuario || !usuario.ativo) {
    throw new HttpError(401, 'Sessão inválida ou expirada.')
  }

  req.auth = { usuario }
  next()
}

export function requireRole(...perfis: Perfil[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !perfis.includes(req.auth.usuario.perfil)) {
      throw new HttpError(403, 'Você não tem permissão para acessar este recurso.')
    }
    next()
  }
}

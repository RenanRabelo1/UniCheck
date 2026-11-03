import type { Request, Response } from 'express'
import { parseOrThrow } from '../../middlewares/validate.js'
import { authService } from './auth.service.js'
import { loginSchema, registerSchema } from './auth.validation.js'

export async function login(req: Request, res: Response) {
  const input = parseOrThrow(loginSchema, req.body ?? {})
  res.json(await authService.login(input))
}

export function me(req: Request, res: Response) {
  res.json(authService.me(req.auth!.usuario))
}

export async function logout(req: Request, res: Response) {
  await authService.logout(req.auth!.sessao)
  res.status(204).end()
}

export async function register(req: Request, res: Response) {
  const input = parseOrThrow(registerSchema, req.body ?? {})
  res.status(201).json(await authService.register(input))
}

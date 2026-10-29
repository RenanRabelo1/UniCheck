import type { Request, Response } from 'express'
import { parseOrThrow } from '../../middlewares/validate.js'
import { authService } from './auth.service.js'
import { loginSchema, registerSchema } from './auth.validation.js'

export async function login(req: Request, res: Response) {
  const input = parseOrThrow(loginSchema, req.body ?? {})
  res.json(await authService.login(input))
}

export async function register(req: Request, res: Response) {
  const input = parseOrThrow(registerSchema, req.body ?? {})
  res.status(201).json(await authService.register(input))
}

import type { Request, Response } from 'express'
import { z } from 'zod'
import { parseOrThrow } from '../../middlewares/validate.js'
import { alertaService } from './alerta.service.js'

const querySchema = z.object({
  status: z.enum(['open', 'resolved', 'all'], { error: 'Status inválido. Use open, resolved ou all.' }).default('open'),
})

export async function list(req: Request, res: Response) {
  const { status } = parseOrThrow(querySchema, req.query)
  res.json(await alertaService.list(status))
}

export async function verificar(_req: Request, res: Response) {
  res.json(await alertaService.verificarAtrasos())
}

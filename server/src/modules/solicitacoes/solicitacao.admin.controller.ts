import type { Request, Response } from 'express'
import { parseOrThrow } from '../../middlewares/validate.js'
import { solicitacaoAdminService } from './solicitacao.admin.service.js'
import { adminListQuerySchema, decisionSchema } from './solicitacao.validation.js'

export async function list(req: Request, res: Response) {
  const filtros = parseOrThrow(adminListQuerySchema, req.query)
  res.json(await solicitacaoAdminService.list(filtros))
}

export async function decide(req: Request, res: Response) {
  const input = parseOrThrow(decisionSchema, req.body ?? {})
  res.json(
    await solicitacaoAdminService.decide(req.auth!.usuario, String(req.params.id), String(req.params.itemId), input),
  )
}

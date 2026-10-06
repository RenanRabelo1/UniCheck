import type { Request, Response } from 'express'
import { HttpError } from '../../middlewares/httpError.js'
import { parseOrThrow } from '../../middlewares/validate.js'
import { solicitacaoService } from './solicitacao.service.js'
import { createSolicitacaoSchema, optionsQuerySchema } from './solicitacao.validation.js'

export async function getOptions(req: Request, res: Response) {
  const { date, pickupTime, returnTime } = parseOrThrow(optionsQuerySchema, req.query)
  const janela = date && pickupTime && returnTime ? { data: date, inicio: pickupTime, fim: returnTime } : undefined

  if ((date || pickupTime || returnTime) && !janela) {
    throw new HttpError(400, 'Informe data, retirada e devolução juntas para ver a disponibilidade.')
  }

  res.json(await solicitacaoService.getOptions(req.auth!.usuario, janela))
}

export async function create(req: Request, res: Response) {
  const input = parseOrThrow(createSolicitacaoSchema, req.body ?? {})
  res.status(201).json(await solicitacaoService.create(req.auth!.usuario, input))
}

export async function list(req: Request, res: Response) {
  res.json(await solicitacaoService.list(req.auth!.usuario))
}

export async function getById(req: Request, res: Response) {
  res.json(await solicitacaoService.getById(req.auth!.usuario, String(req.params.id)))
}

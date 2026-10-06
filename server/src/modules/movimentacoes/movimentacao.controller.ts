import type { Request, Response } from 'express'
import { parseOrThrow } from '../../middlewares/validate.js'
import { movimentacaoService } from './movimentacao.service.js'
import { devolucaoSchema, movimentacaoQuerySchema, retiradaSchema } from './movimentacao.validation.js'

export async function registrarRetirada(req: Request, res: Response) {
  const input = parseOrThrow(retiradaSchema, req.body ?? {})
  res.status(201).json(await movimentacaoService.registrarRetirada(req.auth!.usuario, input))
}

export async function registrarDevolucao(req: Request, res: Response) {
  const input = parseOrThrow(devolucaoSchema, req.body ?? {})
  res.status(201).json(await movimentacaoService.registrarDevolucao(req.auth!.usuario, input))
}

export async function list(req: Request, res: Response) {
  const filtros = parseOrThrow(movimentacaoQuerySchema, req.query)
  res.json(await movimentacaoService.list(filtros))
}

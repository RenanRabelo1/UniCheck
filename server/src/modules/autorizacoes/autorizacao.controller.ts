import type { Request, Response } from 'express'
import { parseOrThrow } from '../../middlewares/validate.js'
import { autorizacaoService, projetoService } from './autorizacao.service.js'
import { createAutorizacaoSchema, createProjetoSchema, updateAtivoSchema } from './autorizacao.validation.js'

export async function listProjetos(_req: Request, res: Response) {
  res.json(await projetoService.list())
}

export async function createProjeto(req: Request, res: Response) {
  const input = parseOrThrow(createProjetoSchema, req.body ?? {})
  res.status(201).json(await projetoService.create(input))
}

export async function updateProjeto(req: Request, res: Response) {
  const { active } = parseOrThrow(updateAtivoSchema, req.body ?? {})
  res.json(await projetoService.setAtivo(String(req.params.id), active))
}

export async function listAutorizacoes(_req: Request, res: Response) {
  res.json(await autorizacaoService.list())
}

export async function getOptions(_req: Request, res: Response) {
  res.json(await autorizacaoService.options())
}

export async function createAutorizacao(req: Request, res: Response) {
  const input = parseOrThrow(createAutorizacaoSchema, req.body ?? {})
  res.status(201).json(await autorizacaoService.create(req.auth!.usuario, input))
}

export async function updateAutorizacao(req: Request, res: Response) {
  const { active } = parseOrThrow(updateAtivoSchema, req.body ?? {})
  res.json(await autorizacaoService.setAtiva(String(req.params.id), active))
}

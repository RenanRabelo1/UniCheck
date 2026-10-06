import type { Request, Response } from 'express'
import { parseOrThrow } from '../../middlewares/validate.js'
import { chaveService, salaService } from './chave.service.js'
import { createChaveSchema, createSalaSchema, updateChaveSchema, updateSalaSchema } from './chave.validation.js'

export async function listSalas(_req: Request, res: Response) {
  res.json(await salaService.list())
}

export async function createSala(req: Request, res: Response) {
  const input = parseOrThrow(createSalaSchema, req.body ?? {})
  res.status(201).json(await salaService.create(input))
}

export async function updateSala(req: Request, res: Response) {
  const input = parseOrThrow(updateSalaSchema, req.body ?? {})
  res.json(await salaService.update(String(req.params.id), input))
}

export async function listChaves(_req: Request, res: Response) {
  res.json(await chaveService.list())
}

export async function createChave(req: Request, res: Response) {
  const input = parseOrThrow(createChaveSchema, req.body ?? {})
  res.status(201).json(await chaveService.create(input))
}

export async function updateChave(req: Request, res: Response) {
  const input = parseOrThrow(updateChaveSchema, req.body ?? {})
  res.json(await chaveService.update(String(req.params.id), input))
}

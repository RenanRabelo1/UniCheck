import type { Request, Response } from 'express'
import { parseOrThrow } from '../../middlewares/validate.js'
import { materialService } from './material.service.js'
import { createMaterialSchema, listMaterialQuerySchema, updateMaterialSchema } from './material.validation.js'

export async function list(req: Request, res: Response) {
  const filtro = parseOrThrow(listMaterialQuerySchema, req.query)
  res.json(await materialService.list(filtro))
}

export async function create(req: Request, res: Response) {
  const input = parseOrThrow(createMaterialSchema, req.body ?? {})
  res.status(201).json(await materialService.create(input))
}

export async function update(req: Request, res: Response) {
  const input = parseOrThrow(updateMaterialSchema, req.body ?? {})
  res.json(await materialService.update(String(req.params.id), input))
}

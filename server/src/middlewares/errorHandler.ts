import type { ErrorRequestHandler, RequestHandler } from 'express'
import { HttpError } from './httpError.js'

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Rota não encontrada.' })
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message })
    return
  }

  // Erros do próprio Express (ex.: JSON malformado no corpo da requisição).
  const status = (error as { status?: unknown }).status
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ message: 'Requisição inválida.' })
    return
  }

  console.error(error)
  res.status(500).json({ message: 'Erro interno do servidor.' })
}

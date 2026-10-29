import type { ErrorRequestHandler, RequestHandler } from 'express'
import { HttpError } from './httpError.js'

const DATABASE_ERROR_CODES = new Set(['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ER_NO_SUCH_TABLE'])

function isDatabaseUnavailable(error: unknown): boolean {
  return DATABASE_ERROR_CODES.has((error as { code?: string }).code ?? '')
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Rota não encontrada.' })
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message })
    return
  }

  // Banco fora do ar, sem migrate ou com senha errada no .env: avisa de um jeito que ajuda a corrigir.
  if (isDatabaseUnavailable(error)) {
    console.error(error)
    res.status(503).json({
      message: 'Banco de dados indisponível. Confira se o MySQL está rodando e se o "npm run migrate" foi executado.',
    })
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

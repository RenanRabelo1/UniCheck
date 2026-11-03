import { ipKeyGenerator, rateLimit } from 'express-rate-limit'

const QUINZE_MINUTOS = 15 * 60 * 1000

/**
 * Freia tentativas de senha contra uma conta. Conta só as falhas e separa por origem e identificador:
 * vários alunos na mesma rede da universidade não bloqueiam uns aos outros.
 */
export const loginLimiter = rateLimit({
  windowMs: QUINZE_MINUTOS,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const body = req.body as { identifier?: unknown } | undefined
    return `${ipKeyGenerator(req.ip ?? '')}:${String(body?.identifier ?? '').trim().toLowerCase()}`
  },
  message: { message: 'Muitas tentativas de login. Aguarde 15 minutos e tente novamente.' },
})

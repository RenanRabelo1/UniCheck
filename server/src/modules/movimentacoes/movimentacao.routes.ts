import { Router } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate.js'
import { list, registrarDevolucao, registrarRetirada } from './movimentacao.controller.js'

export const movimentacaoRoutes = Router()

// Regra do docs: quem registra retirada e devolução é a Secretaria (a Coordenação também pode).
movimentacaoRoutes.use(authenticate, requireRole('FUNCIONARIO', 'COORDENADOR'))

movimentacaoRoutes.get('/', list)
movimentacaoRoutes.post('/retiradas', registrarRetirada)
movimentacaoRoutes.post('/devolucoes', registrarDevolucao)

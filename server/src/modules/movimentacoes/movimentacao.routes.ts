import { Router } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate.js'
import { historico, list, registrarDevolucao, registrarRetirada } from './movimentacao.controller.js'

export const movimentacaoRoutes = Router()

movimentacaoRoutes.use(authenticate, requireRole('FUNCIONARIO', 'COORDENADOR'))

movimentacaoRoutes.get('/', list)
movimentacaoRoutes.get('/historico', historico)
// Decisão da equipe (RN09): só o Coordenador do CCT confirma retirada e devolução.
movimentacaoRoutes.post('/retiradas', requireRole('COORDENADOR'), registrarRetirada)
movimentacaoRoutes.post('/devolucoes', requireRole('COORDENADOR'), registrarDevolucao)

import { Router } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate.js'
import { decide, list } from './solicitacao.admin.controller.js'

export const solicitacaoAdminRoutes = Router()

solicitacaoAdminRoutes.use(authenticate)

// Consultar a fila: Coordenação e Secretaria. Decidir: só a Coordenação (regra do docs).
solicitacaoAdminRoutes.get('/', requireRole('COORDENADOR', 'FUNCIONARIO'), list)
solicitacaoAdminRoutes.post('/:id/itens/:itemId/decisao', requireRole('COORDENADOR'), decide)

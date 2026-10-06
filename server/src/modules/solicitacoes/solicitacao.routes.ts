import { Router } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate.js'
import { create, getById, getOptions, list } from './solicitacao.controller.js'

export const solicitacaoRoutes = Router()

// Todas as rotas deste módulo exigem login. O coordenador terá rotas próprias.
solicitacaoRoutes.use(authenticate, requireRole('PROFESSOR', 'ALUNO'))

// "/opcoes" precisa vir ANTES de "/:id", senão o Express trataria "opcoes" como um id.
solicitacaoRoutes.get('/opcoes', getOptions)
solicitacaoRoutes.get('/', list)
solicitacaoRoutes.post('/', create)
solicitacaoRoutes.get('/:id', getById)

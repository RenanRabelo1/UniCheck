import { Router } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate.js'
import { getAdminDashboard, getDashboard } from './dashboard.controller.js'

export const dashboardRoutes = Router()

// Cada público tem o seu painel: professor e aluno veem os próprios itens; a Coordenação vê a operação.
dashboardRoutes.get('/', authenticate, requireRole('PROFESSOR', 'ALUNO'), getDashboard)
dashboardRoutes.get('/admin', authenticate, requireRole('COORDENADOR', 'FUNCIONARIO'), getAdminDashboard)

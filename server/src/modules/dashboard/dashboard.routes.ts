import { Router } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate.js'
import { getDashboard } from './dashboard.controller.js'

export const dashboardRoutes = Router()

// O painel de início existe para professor e aluno. O coordenador terá painel próprio.
dashboardRoutes.get('/', authenticate, requireRole('PROFESSOR', 'ALUNO'), getDashboard)

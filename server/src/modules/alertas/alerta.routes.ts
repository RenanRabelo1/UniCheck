import { Router } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate.js'
import { list, verificar } from './alerta.controller.js'

export const alertaRoutes = Router()

alertaRoutes.use(authenticate, requireRole('COORDENADOR', 'FUNCIONARIO'))

alertaRoutes.get('/', list)
// Execução manual da verificação (a automática roda a cada minuto, ver jobs/atrasos.job.ts).
alertaRoutes.post('/verificar', requireRole('COORDENADOR'), verificar)

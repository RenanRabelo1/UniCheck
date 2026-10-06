import { Router } from 'express'
import { alertaRoutes } from '../modules/alertas/alerta.routes.js'
import { chaveRoutes, salaRoutes } from '../modules/chaves/chave.routes.js'
import { authRoutes } from '../modules/auth/auth.routes.js'
import { dashboardRoutes } from '../modules/dashboard/dashboard.routes.js'
import { materialRoutes } from '../modules/materiais/material.routes.js'
import { movimentacaoRoutes } from '../modules/movimentacoes/movimentacao.routes.js'
import { solicitacaoAdminRoutes } from '../modules/solicitacoes/solicitacao.admin.routes.js'
import { solicitacaoRoutes } from '../modules/solicitacoes/solicitacao.routes.js'

export const routes = Router()

routes.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})
routes.use('/auth', authRoutes)
routes.use('/dashboard', dashboardRoutes)
routes.use('/solicitacoes', solicitacaoRoutes)
routes.use('/admin/solicitacoes', solicitacaoAdminRoutes)
routes.use('/movimentacoes', movimentacaoRoutes)
routes.use('/alertas', alertaRoutes)
routes.use('/admin/materiais', materialRoutes)
routes.use('/admin/salas', salaRoutes)
routes.use('/admin/chaves', chaveRoutes)

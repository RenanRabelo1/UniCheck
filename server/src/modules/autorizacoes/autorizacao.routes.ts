import { Router } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate.js'
import {
  createAutorizacao,
  createProjeto,
  getOptions,
  listAutorizacoes,
  listProjetos,
  updateAutorizacao,
  updateProjeto,
} from './autorizacao.controller.js'

export const projetoRoutes = Router()
export const autorizacaoRoutes = Router()

for (const router of [projetoRoutes, autorizacaoRoutes]) {
  router.use(authenticate)
}

// Consultar: Coordenação e Secretaria. Alterar: só a Coordenação. Sem DELETE: só inativar.
projetoRoutes.get('/', requireRole('COORDENADOR', 'FUNCIONARIO'), listProjetos)
projetoRoutes.post('/', requireRole('COORDENADOR'), createProjeto)
projetoRoutes.patch('/:id', requireRole('COORDENADOR'), updateProjeto)

// "/opcoes" precisa vir antes de qualquer rota "/:id" de leitura.
autorizacaoRoutes.get('/opcoes', requireRole('COORDENADOR', 'FUNCIONARIO'), getOptions)
autorizacaoRoutes.get('/', requireRole('COORDENADOR', 'FUNCIONARIO'), listAutorizacoes)
autorizacaoRoutes.post('/', requireRole('COORDENADOR'), createAutorizacao)
autorizacaoRoutes.patch('/:id', requireRole('COORDENADOR'), updateAutorizacao)

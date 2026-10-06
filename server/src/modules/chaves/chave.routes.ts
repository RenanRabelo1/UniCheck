import { Router } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate.js'
import {
  createChave,
  createSala,
  listChaves,
  listSalas,
  updateChave,
  updateSala,
} from './chave.controller.js'

// Salas e chaves pertencem ao mesmo módulo (docs), mas cada uma tem a sua URL.
export const salaRoutes = Router()
export const chaveRoutes = Router()

for (const router of [salaRoutes, chaveRoutes]) {
  router.use(authenticate)
}

// Consultar: Coordenação e Secretaria. Alterar: só a Coordenação. Sem DELETE: só inativar.
salaRoutes.get('/', requireRole('COORDENADOR', 'FUNCIONARIO'), listSalas)
salaRoutes.post('/', requireRole('COORDENADOR'), createSala)
salaRoutes.patch('/:id', requireRole('COORDENADOR'), updateSala)

chaveRoutes.get('/', requireRole('COORDENADOR', 'FUNCIONARIO'), listChaves)
chaveRoutes.post('/', requireRole('COORDENADOR'), createChave)
chaveRoutes.patch('/:id', requireRole('COORDENADOR'), updateChave)

import { Router } from 'express'
import { authenticate, requireRole } from '../../middlewares/authenticate.js'
import { create, list, update } from './material.controller.js'

export const materialRoutes = Router()

materialRoutes.use(authenticate)

// Consultar o cadastro: Coordenação e Secretaria. Alterar: só a Coordenação.
materialRoutes.get('/', requireRole('COORDENADOR', 'FUNCIONARIO'), list)
materialRoutes.post('/', requireRole('COORDENADOR'), create)
// Não existe DELETE de propósito: materiais são inativados (PATCH { active: false }), nunca removidos.
materialRoutes.patch('/:id', requireRole('COORDENADOR'), update)

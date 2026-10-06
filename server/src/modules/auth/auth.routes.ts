import { Router } from 'express'
import { login } from './auth.controller.js'

export const authRoutes = Router()

authRoutes.post('/login', login)

import { Router } from 'express'
import { authenticate } from '../../middlewares/authenticate.js'
import { loginLimiter } from '../../middlewares/rateLimit.js'
import { login, logout, me, register } from './auth.controller.js'

export const authRoutes = Router()

authRoutes.post('/login', loginLimiter, login)
authRoutes.get('/me', authenticate, me)
authRoutes.post('/logout', authenticate, logout)
authRoutes.post('/register', register)

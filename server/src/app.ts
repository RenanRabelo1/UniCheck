import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { config } from './config.js'
import { errorHandler, notFound } from './middlewares/errorHandler.js'
import { routes } from './routes/index.js'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: config.corsOrigins }))
  app.use(express.json())

  app.use(routes)
  app.use(notFound)
  app.use(errorHandler)

  return app
}

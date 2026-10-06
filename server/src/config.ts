import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config({ quiet: true })

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data')
const isProduction = process.env.NODE_ENV === 'production'
const jwtSecret = process.env.JWT_SECRET

if (isProduction && (!jwtSecret || jwtSecret.startsWith('defina_'))) {
  throw new Error('Defina um JWT_SECRET forte no ambiente de produção.')
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  // Em desenvolvimento/testes existe um valor padrão para o projeto subir sem .env.
  jwtSecret: jwtSecret ?? 'unicheck-segredo-apenas-para-desenvolvimento',
  jwtExpiresIn: '8h' as const,
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()),
  // "Banco" provisório em JSON. Será trocado por MySQL/Supabase nos repositories.
  // db.seed.json (versionado) é o ponto de partida; db.json (ignorado pelo Git) é o que o servidor usa e altera.
  dataFile: process.env.DATA_FILE ?? path.join(dataDir, 'db.json'),
  seedFile: path.join(dataDir, 'db.seed.json'),
}

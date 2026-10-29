import dotenv from 'dotenv'

dotenv.config({ quiet: true })

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
  // MySQL: valores do .env de cada membro (veja .env.example). O padrão serve para um MySQL local.
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'unicheck',
  },
}

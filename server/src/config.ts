import dotenv from 'dotenv'

dotenv.config({ quiet: true })

// Só máquina de desenvolvimento e testes têm padrão. Sem NODE_ENV não é ambiente local: um servidor
// publicado que esqueceu a variável não pode cair no segredo que está no código.
const isLocal = ['development', 'test'].includes(process.env.NODE_ENV ?? '')
const jwtSecret = process.env.JWT_SECRET

if (!isLocal && (!jwtSecret || jwtSecret.startsWith('defina_'))) {
  throw new Error('Defina um JWT_SECRET forte. Em desenvolvimento, use NODE_ENV=development no .env.')
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  // Em desenvolvimento/testes existe um valor padrão para o projeto subir sem .env.
  jwtSecret: jwtSecret || 'unicheck-segredo-apenas-para-desenvolvimento',
  jwtExpiresIn: '8h' as const,
  // Quantos proxies (ex.: a plataforma de hospedagem) ficam na frente da API. Define o IP real do cliente.
  trustProxy: Number(process.env.TRUST_PROXY ?? 0),
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

import { checkConnection, closePool } from './connection.js'
import { config } from '../config.js'

// Uso: npm run db:check (dentro de server/ ou pela raiz com -w @unicheck/server)
try {
  const version = await checkConnection()
  console.log(`Conectado ao MySQL ${version} em ${config.database.host}:${config.database.port}/${config.database.name}`)
} catch (error) {
  console.error('Não foi possível conectar ao MySQL. Confira o .env e se o serviço MySQL80 está rodando.')
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  await closePool()
}

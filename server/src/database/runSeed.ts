import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { config } from '../config.js'
import { openAdminConnection, runSqlFile } from './admin.js'

export const demoSeedFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'seeds/demo.sql')

// Uso: npm run db:seed  (depois do npm run migrate). Pode rodar de novo sem duplicar nada.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const connection = await openAdminConnection()
  try {
    await runSqlFile(connection, demoSeedFile)
    console.log(`Dados de demonstração gravados em "${config.database.name}". Senha dos usuários de teste: unicheck123`)
  } catch (error) {
    console.error('Falha ao gravar os dados de demonstração. Rode "npm run migrate" antes.')
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  } finally {
    await connection.end()
  }
}

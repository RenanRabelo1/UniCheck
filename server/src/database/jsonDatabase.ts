import { access, copyFile, readFile, rename, writeFile } from 'node:fs/promises'
import { config } from '../config.js'
import type { Database } from './types.js'

let ready: Promise<void> | undefined

// Na primeira execução, o db.json ainda não existe: copia os dados iniciais (db.seed.json).
function ensureDatabase(): Promise<void> {
  ready ??= access(config.dataFile)
    .catch(() => copyFile(config.seedFile, config.dataFile))
    .catch((error: unknown) => {
      ready = undefined // tenta de novo na próxima chamada
      throw error
    })
  return ready
}

/**
 * Acesso ao "banco" em JSON.
 * Quando migrarmos para MySQL/Supabase, só os repositories precisam mudar.
 */
export async function readDatabase(): Promise<Database> {
  await ensureDatabase()
  const content = await readFile(config.dataFile, 'utf-8')
  return JSON.parse(content) as Database
}

// Grava num arquivo temporário e depois renomeia: se der erro no meio,
// o db.json original não fica pela metade.
async function writeDatabase(database: Database): Promise<void> {
  const tempFile = `${config.dataFile}.tmp`
  await writeFile(tempFile, JSON.stringify(database, null, 2), 'utf-8')
  await rename(tempFile, config.dataFile)
}

// Fila de alterações: uma de cada vez, na ordem de chegada.
let queue: Promise<unknown> = Promise.resolve()

/**
 * "Transação" do JSON: lê o banco, roda `change` e só então grava.
 * - Se `change` lançar um erro, nada é gravado (tudo ou nada).
 * - Como as chamadas entram numa fila, dois pedidos simultâneos não
 *   sobrescrevem um ao outro nem passam na mesma checagem de disponibilidade.
 * Em MySQL isso vira `BEGIN ... COMMIT` / `ROLLBACK`.
 */
export function updateDatabase<T>(change: (database: Database) => T): Promise<T> {
  const result = queue.then(async () => {
    const database = await readDatabase()
    const value = change(database)
    await writeDatabase(database)
    return value
  })
  queue = result.catch(() => undefined)
  return result
}

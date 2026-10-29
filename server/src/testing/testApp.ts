// Utilitários só para testes (fora do build, ver tsconfig.json).
import request from 'supertest'
import { vi } from 'vitest'

// Os testes usam um banco PRÓPRIO ("<DB_NAME>_test"): o banco de desenvolvimento nunca é tocado.
// Isto precisa rodar antes de qualquer import que leia o config, por isso os imports abaixo são dinâmicos.
const baseName = (process.env.DB_NAME ?? 'unicheck').replace(/_test$/, '')
process.env.DB_NAME = `${baseName}_test`

let migrated: Promise<void> | undefined

/**
 * Deixa o banco de teste no estado inicial: aplica as migrations (uma vez por arquivo de teste),
 * apaga tudo e grava os dados de demonstração. IDs dos dados de demonstração (fixos):
 *   usuários 1001 prof · 1002 aluno autorizado · 1003 aluno sem autorização · 1004 coordenação
 *   salas 1001 J-201 · 1002 J-204 · 1003 J-311
 *   materiais 1001 projetor · 1002 notebook · 1003 HDMI · 1004 Arduino
 *   chaves 1001 J-201 P · 1002 J-204 P · 1003 J-204 S · 1004 J-311 P
 *   solicitações 1001..1007 · itens 1001..1010 · movimentações 1001..1008
 */
export async function resetDatabase() {
  const { config } = await import('../config.js')
  if (!config.database.name.endsWith('_test')) {
    throw new Error(`Recusando apagar o banco "${config.database.name}": os testes só mexem em bancos terminados em _test.`)
  }
  const { openAdminConnection, runSqlFile } = await import('../database/admin.js')
  const { migrate } = await import('../database/runMigrations.js')
  const { demoSeedFile } = await import('../database/runSeed.js')

  const connection = await openAdminConnection()
  try {
    migrated ??= migrate(connection).then(() => undefined)
    await migrated

    const [tables] = await connection.query<import('mysql2/promise').RowDataPacket[]>(
      "SELECT table_name AS nome FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name <> 'schema_migrations'",
    )
    await connection.query('SET FOREIGN_KEY_CHECKS = 0')
    for (const { nome } of tables) await connection.query(`TRUNCATE TABLE \`${String(nome)}\``)
    await connection.query('SET FOREIGN_KEY_CHECKS = 1')
    await runSqlFile(connection, demoSeedFile)
  } finally {
    await connection.end()
  }
}

export async function createTestApp() {
  await resetDatabase() // volta ao estado inicial a cada teste
  const { createApp } = await import('../app.js')
  return createApp()
}

export type TestApp = Awaited<ReturnType<typeof createTestApp>>

export async function tokenOf(app: TestApp, identifier: string): Promise<string> {
  const response = await request(app).post('/auth/login').send({ identifier, password: 'unicheck123' })
  return `Bearer ${response.body.token as string}`
}

/** Congela o "agora" para os testes não dependerem do dia em que rodam. */
export function fixNow(iso: string) {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(iso) })
}

/** Cria o app e faz login dos perfis, já com o relógio congelado. */
export async function start(nowIso: string) {
  fixNow(nowIso) // antes do login: o token nasce no "agora" congelado
  const app = await createTestApp()
  return {
    app,
    professor: await tokenOf(app, '2048819'),
    aluno: await tokenOf(app, 'aluno.autorizado@unifor.br'),
    alunoSem: await tokenOf(app, 'aluno.naoautorizado@unifor.br'),
    coord: await tokenOf(app, '18024900'),
  }
}

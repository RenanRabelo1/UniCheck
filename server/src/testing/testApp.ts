// Utilitários só para testes (fora do build, ver tsconfig.json).
import { copyFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import request from 'supertest'
import { vi } from 'vitest'

// Os testes GRAVAM no banco, então rodam sobre uma cópia temporária do db.json.
const seedFile = fileURLToPath(new URL('../../data/db.seed.json', import.meta.url))
const tempFile = path.join(mkdtempSync(path.join(tmpdir(), 'unicheck-')), 'db.json')

export async function createTestApp() {
  copyFileSync(seedFile, tempFile) // volta ao estado inicial a cada teste
  process.env.DATA_FILE = tempFile
  // Só pode importar o app depois de definir DATA_FILE (o config lê na importação).
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

/** Cria o app e faz login dos 4 perfis, já com o relógio congelado. */
export async function start(nowIso: string) {
  fixNow(nowIso) // antes do login: o token nasce no "agora" congelado
  const app = await createTestApp()
  return {
    app,
    professor: await tokenOf(app, '2048819'),
    aluno: await tokenOf(app, 'aluno.autorizado@unifor.br'),
    coord: await tokenOf(app, '18024900'),
    staff: await tokenOf(app, '30011001'),
  }
}

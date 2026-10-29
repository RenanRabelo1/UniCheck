import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type mysql from 'mysql2/promise'
import { config } from '../config.js'
import { openAdminConnection, runSqlFile } from './admin.js'

const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'migrations')

/**
 * Aplica, em ordem, os arquivos .sql de src/database/migrations que ainda não rodaram.
 * O nome de cada arquivo executado fica registrado na tabela schema_migrations,
 * então rodar "npm run migrate" duas vezes não repete nada.
 *
 * Regra do grupo: para mudar o banco, crie um arquivo novo (ex.: 006_adiciona_coluna.sql)
 * e faça commit. Nunca edite uma migration que já foi para o Git.
 */
export async function migrate(connection?: mysql.Connection): Promise<string[]> {
  const own = connection ?? (await openAdminConnection())
  try {
    await own.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        nome VARCHAR(190) PRIMARY KEY,
        executada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `)

    const [done] = await own.query<mysql.RowDataPacket[]>('SELECT nome FROM schema_migrations')
    const alreadyRun = new Set(done.map((row) => String(row.nome)))

    const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort()
    const pending = files.filter((file) => !alreadyRun.has(file))

    for (const file of pending) {
      console.log(`Aplicando ${file}...`)
      // Atenção: no MySQL, comandos de criar/alterar tabela não voltam atrás (sem rollback).
      // Por isso cada migration deve ser pequena e fazer uma coisa só.
      await runSqlFile(own, path.join(migrationsDir, file))
      await own.query('INSERT INTO schema_migrations (nome) VALUES (?)', [file])
    }
    return pending
  } finally {
    if (!connection) await own.end()
  }
}

// Só roda sozinho quando chamado pelo "npm run migrate" (os testes importam a função migrate).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const applied = await migrate()
    console.log(applied.length === 0 ? 'Banco já está atualizado.' : `${applied.length} migration(s) aplicada(s) em "${config.database.name}".`)
  } catch (error) {
    console.error('Falha ao rodar as migrations:')
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}

import { readFile } from 'node:fs/promises'
import mysql from 'mysql2/promise'
import { config } from '../config.js'

/**
 * Conexão "de administrador" usada por migrations, seeds e testes: aceita vários comandos por arquivo
 * (a API usa o pool, que não aceita isso de propósito) e cria o banco se ele ainda não existir.
 */
export async function openAdminConnection(database = config.database.name): Promise<mysql.Connection> {
  const { host, port, user, password } = config.database
  const connection = await mysql.createConnection({ host, port, user, password, multipleStatements: true })
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await connection.query(`USE \`${database}\``)
  await connection.query("SET time_zone = '-03:00'")
  return connection
}

export async function runSqlFile(connection: mysql.Connection, file: string): Promise<void> {
  await connection.query(await readFile(file, 'utf-8'))
}

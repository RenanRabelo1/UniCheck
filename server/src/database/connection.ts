import mysql from 'mysql2/promise'
import { config } from '../config.js'

/**
 * Pool de conexões com o MySQL.
 * O pool só abre conexões quando alguém faz a primeira consulta.
 */
export const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  // Datas e horas voltam como texto ('2026-11-26', '09:00:00'), sem conversão de fuso do JavaScript.
  dateStrings: true,
})

// Toda conexão trabalha no horário de Fortaleza (NOW(), triggers e eventos do banco também).
pool.on('connection', (connection) => {
  connection.query("SET time_zone = '-03:00'")
})

/** Confere se o banco responde. Devolve a versão do MySQL (útil para checar o mínimo 8.0.16). */
export async function checkConnection(): Promise<string> {
  const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT VERSION() AS version')
  return String(rows[0]?.version)
}

export function closePool(): Promise<void> {
  return pool.end()
}

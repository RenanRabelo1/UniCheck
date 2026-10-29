import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise'
import { pool } from './connection.js'

/** Tanto o pool quanto uma conexão de transação aceitam as mesmas consultas. */
export type Db = Pool | PoolConnection

/**
 * Roda `work` dentro de uma transação: se algo lançar erro, nada é gravado (ROLLBACK).
 *
 * - READ COMMITTED: cada consulta enxerga o que os outros já confirmaram. Combinado com
 *   `SELECT ... FOR UPDATE`, é o que impede duas aprovações simultâneas do mesmo item.
 * - `lockName`: trava nomeada, para cadastros que precisam conferir "já existe?" antes de gravar
 *   (duas pessoas cadastrando o mesmo nome ao mesmo tempo esperam uma pela outra).
 */
export async function withTransaction<T>(work: (connection: PoolConnection) => Promise<T>, lockName?: string): Promise<T> {
  const connection = await pool.getConnection()
  let locked = false
  try {
    if (lockName) {
      const [rows] = await connection.query<RowDataPacket[]>('SELECT GET_LOCK(?, 10) AS ok', [lockName])
      if (rows[0]?.ok !== 1) throw new Error('Não foi possível obter a trava do cadastro. Tente novamente.')
      locked = true
    }
    await connection.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED')
    await connection.beginTransaction()
    try {
      const result = await work(connection)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    }
  } finally {
    if (locked) await connection.query('SELECT RELEASE_LOCK(?)', [lockName])
    connection.release()
  }
}

/** Ids da API são números em texto ("12"). Qualquer outra coisa nunca existe no banco. */
export function parseId(value: string): number | undefined {
  return /^\d{1,15}$/.test(value) ? Number(value) : undefined
}

/** HH:MM:SS do banco -> HH:mm da API. */
export const toHm = (time: string): string => time.slice(0, 5)

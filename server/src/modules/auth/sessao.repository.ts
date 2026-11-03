import type { RowDataPacket } from 'mysql2/promise'
import { pool } from '../../database/connection.js'
import { toDbDateTime } from '../../utils/dates.js'

export const sessaoRepository = {
  async estaRevogada(jti: string): Promise<boolean> {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT 1 FROM sessao_revogada WHERE jti = ?', [jti])
    return rows.length > 0
  },

  /** Revoga o token e aproveita para limpar os que já expiraram sozinhos. */
  async revogar(jti: string, expiraEm: Date, now: Date = new Date()): Promise<void> {
    await pool.execute('DELETE FROM sessao_revogada WHERE expira_em < ?', [toDbDateTime(now)])
    await pool.execute('INSERT IGNORE INTO sessao_revogada (jti, expira_em) VALUES (?, ?)', [jti, toDbDateTime(expiraEm)])
  },
}

import type { RowDataPacket } from 'mysql2/promise'
import { pool } from '../../database/connection.js'
import { parseId, type Db } from '../../database/sql.js'
import type { Alerta } from '../../database/types.js'
import { fromDbDateTime, toDbDateTime } from '../../utils/dates.js'

export type AlertaComSolicitante = Alerta & { solicitanteNome: string | null }

export const alertaRepository = {
  /** Alertas (ocorrências de atraso), do mais recente para o mais antigo. `resolvido` omitido = todos. */
  async list(resolvido?: boolean, db: Db = pool): Promise<AlertaComSolicitante[]> {
    const [rows] = await db.query<
      (RowDataPacket & {
        id_atraso: number
        id_item_solicitado: number
        id_solicitacao: number
        id_usuario_solicitante: number
        nome_item: string
        solicitante: string | null
        data_hora_geracao: string
        data_hora_resolucao: string | null
      })[]
    >(
      `SELECT a.id_atraso, a.id_item_solicitado, i.id_solicitacao, s.id_usuario_solicitante, i.nome_item,
              u.nome AS solicitante, a.data_hora_geracao, a.data_hora_resolucao
       FROM ocorrencia_atraso a
       JOIN item_solicitado i ON i.id_item_solicitado = a.id_item_solicitado
       JOIN solicitacao s ON s.id_solicitacao = i.id_solicitacao
       LEFT JOIN usuario u ON u.id_usuario = s.id_usuario_solicitante
       ${resolvido === undefined ? '' : `WHERE a.status = '${resolvido ? 'RESOLVIDA' : 'ABERTA'}'`}
       ORDER BY a.data_hora_geracao DESC, a.id_atraso DESC`,
    )

    return rows.map((row) => ({
      id: String(row.id_atraso),
      solicitacaoId: String(row.id_solicitacao),
      itemId: String(row.id_item_solicitado),
      itemNome: row.nome_item,
      usuarioId: String(row.id_usuario_solicitante),
      solicitanteNome: row.solicitante,
      criadoEm: fromDbDateTime(row.data_hora_geracao),
      resolvidoEm: row.data_hora_resolucao ? fromDbDateTime(row.data_hora_resolucao) : undefined,
    }))
  },

  /** Itens em posse cuja devolução já venceu. Trava as linhas: duas verificações ao mesmo tempo não duplicam alertas. */
  async listItensVencidosForUpdate(hoje: string, jaPassouDoLimite: boolean, db: Db): Promise<{ id: string }[]> {
    const [rows] = await db.query<(RowDataPacket & { id_item_solicitado: number })[]>(
      `SELECT i.id_item_solicitado FROM item_solicitado i
       JOIN solicitacao s ON s.id_solicitacao = i.id_solicitacao
       WHERE i.status_item = 'RETIRADO' AND s.data_utilizacao ${jaPassouDoLimite ? '<=' : '<'} ?
       FOR UPDATE`,
      [hoje],
    )
    return rows.map((row) => ({ id: String(row.id_item_solicitado) }))
  },

  async create(itemId: string, now: Date, db: Db): Promise<void> {
    await db.execute('INSERT IGNORE INTO ocorrencia_atraso (id_item_solicitado, data_hora_geracao) VALUES (?, ?)', [
      parseId(itemId) ?? 0,
      toDbDateTime(now),
    ])
  },

  /** Devolver o item resolve o alerta aberto dele. */
  async resolverDoItem(itemId: string, now: Date, db: Db): Promise<void> {
    await db.execute(
      "UPDATE ocorrencia_atraso SET status = 'RESOLVIDA', data_hora_resolucao = ? WHERE id_item_solicitado = ? AND status = 'ABERTA'",
      [toDbDateTime(now), parseId(itemId) ?? 0],
    )
  },
}

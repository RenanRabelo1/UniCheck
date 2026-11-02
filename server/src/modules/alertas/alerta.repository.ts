import type { RowDataPacket } from 'mysql2/promise'
import { pool } from '../../database/connection.js'
import { parseId, toHm, type Db } from '../../database/sql.js'
import type { Alerta, TipoChave, TipoItem } from '../../database/types.js'
import { fromDbDateTime, toDbDateTime } from '../../utils/dates.js'

/** Alerta com o que a tela de atrasos mostra: responsável, item, sala da chave e horários. */
export type AlertaComSolicitante = Alerta & {
  protocolo: string
  solicitanteNome: string | null
  matricula: string | null
  contato: string | null
  tipoItem: TipoItem
  sala: string | null
  tipoChave: TipoChave | null
  dataUtilizacao: string
  devolucaoPrevista: string
  retiradoEm: string | null
}

export const alertaRepository = {
  /** Alertas (ocorrências de atraso), do mais recente para o mais antigo. `resolvido` omitido = todos. */
  async list(resolvido?: boolean, db: Db = pool): Promise<AlertaComSolicitante[]> {
    const [rows] = await db.query<
      (RowDataPacket & {
        id_atraso: number
        id_item_solicitado: number
        id_solicitacao: number
        id_usuario_solicitante: number
        numero_protocolo: string
        nome_item: string
        id_chave: number | null
        solicitante: string | null
        matricula: string | null
        contato: string | null
        sala: string | null
        tipo_chave: TipoChave | null
        data_utilizacao: string
        hora_devolucao_prevista: string
        retirado_em: string | null
        data_hora_geracao: string
        data_hora_resolucao: string | null
      })[]
    >(
      `SELECT a.id_atraso, a.id_item_solicitado, i.id_solicitacao, s.id_usuario_solicitante, s.numero_protocolo,
              i.nome_item, i.id_chave, u.nome AS solicitante, u.matricula, u.contato, sl.codigo AS sala, c.tipo_chave,
              s.data_utilizacao, s.hora_devolucao_prevista, a.data_hora_geracao, a.data_hora_resolucao,
              (SELECT MAX(m.data_hora_real) FROM movimentacao m
               WHERE m.id_item_solicitado = i.id_item_solicitado AND m.tipo_movimentacao = 'RETIRADA') AS retirado_em
       FROM ocorrencia_atraso a
       JOIN item_solicitado i ON i.id_item_solicitado = a.id_item_solicitado
       JOIN solicitacao s ON s.id_solicitacao = i.id_solicitacao
       LEFT JOIN usuario u ON u.id_usuario = s.id_usuario_solicitante
       LEFT JOIN chave c ON c.id_chave = i.id_chave
       LEFT JOIN sala sl ON sl.id_sala = c.id_sala
       ${resolvido === undefined ? '' : `WHERE a.status = '${resolvido ? 'RESOLVIDA' : 'ABERTA'}'`}
       ORDER BY a.data_hora_geracao DESC, a.id_atraso DESC`,
    )

    return rows.map((row) => ({
      id: String(row.id_atraso),
      solicitacaoId: String(row.id_solicitacao),
      itemId: String(row.id_item_solicitado),
      protocolo: row.numero_protocolo,
      itemNome: row.nome_item,
      usuarioId: String(row.id_usuario_solicitante),
      solicitanteNome: row.solicitante,
      matricula: row.matricula,
      contato: row.contato,
      tipoItem: row.id_chave === null ? 'MATERIAL' : 'CHAVE',
      sala: row.sala,
      tipoChave: row.tipo_chave,
      dataUtilizacao: row.data_utilizacao,
      devolucaoPrevista: toHm(row.hora_devolucao_prevista),
      retiradoEm: row.retirado_em ? fromDbDateTime(row.retirado_em) : null,
      criadoEm: fromDbDateTime(row.data_hora_geracao),
      resolvidoEm: row.data_hora_resolucao ? fromDbDateTime(row.data_hora_resolucao) : undefined,
    }))
  },

  async contarAbertos(db: Db = pool): Promise<number> {
    const [rows] = await db.query<(RowDataPacket & { total: number })[]>(
      "SELECT COUNT(*) AS total FROM ocorrencia_atraso WHERE status = 'ABERTA'",
    )
    return Number(rows[0]?.total ?? 0)
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

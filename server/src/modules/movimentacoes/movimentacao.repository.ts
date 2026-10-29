import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { pool } from '../../database/connection.js'
import { parseId, type Db } from '../../database/sql.js'
import type { Movimentacao, MovimentacaoComAutor, TipoMovimentacao } from '../../database/types.js'
import { fromDbDateTime, toDbDateTime } from '../../utils/dates.js'

type MovimentacaoRow = RowDataPacket & {
  id_movimentacao: number
  tipo_movimentacao: TipoMovimentacao
  id_solicitacao: number
  id_item_solicitado: number
  nome_item: string
  id_coordenador: number
  autor: string | null
  responsavel: string | null
  data_hora_real: string
  observacao: string | null
}

export const movimentacaoRepository = {
  /** Histórico, do registro mais recente para o mais antigo. */
  async list(filtros: { requestId?: string; itemId?: string }, db: Db = pool): Promise<MovimentacaoComAutor[]> {
    const where: string[] = []
    const params: unknown[] = []
    if (filtros.requestId) {
      where.push('i.id_solicitacao = ?')
      params.push(parseId(filtros.requestId) ?? 0)
    }
    if (filtros.itemId) {
      where.push('m.id_item_solicitado = ?')
      params.push(parseId(filtros.itemId) ?? 0)
    }

    const [rows] = await db.query<MovimentacaoRow[]>(
      `SELECT m.id_movimentacao, m.tipo_movimentacao, i.id_solicitacao, m.id_item_solicitado, i.nome_item,
              m.id_coordenador, u.nome AS autor, m.responsavel, m.data_hora_real, m.observacao
       FROM movimentacao m
       JOIN item_solicitado i ON i.id_item_solicitado = m.id_item_solicitado
       LEFT JOIN usuario u ON u.id_usuario = m.id_coordenador
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY m.data_hora_real DESC, m.id_movimentacao DESC`,
      params,
    )

    return rows.map((row) => ({
      id: String(row.id_movimentacao),
      tipo: row.tipo_movimentacao,
      solicitacaoId: String(row.id_solicitacao),
      itemId: String(row.id_item_solicitado),
      itemNome: row.nome_item,
      registradoPorId: String(row.id_coordenador),
      registradoPorNome: row.autor,
      responsavel: row.responsavel ?? '',
      registradoEm: fromDbDateTime(row.data_hora_real),
      observacao: row.observacao ?? undefined,
    }))
  },

  /** Registra a retirada ou devolução. Roda junto com a mudança de status do item (mesma transação). */
  async create(
    data: {
      tipo: TipoMovimentacao
      solicitacaoId: string
      itemId: string
      itemNome: string
      registradoPorId: string
      responsavel: string
      observacao?: string
      now: Date
    },
    db: Db,
  ): Promise<Movimentacao> {
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO movimentacao (id_item_solicitado, id_coordenador, tipo_movimentacao, data_hora_real, observacao, responsavel)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        parseId(data.itemId) ?? 0,
        parseId(data.registradoPorId) ?? 0,
        data.tipo,
        toDbDateTime(data.now),
        data.observacao ?? null,
        data.responsavel,
      ],
    )
    return {
      id: String(result.insertId),
      tipo: data.tipo,
      solicitacaoId: data.solicitacaoId,
      itemId: data.itemId,
      itemNome: data.itemNome,
      registradoPorId: data.registradoPorId,
      responsavel: data.responsavel,
      registradoEm: data.now.toISOString(),
      observacao: data.observacao,
    }
  },
}

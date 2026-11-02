import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { pool } from '../../database/connection.js'
import { parseId, type Db } from '../../database/sql.js'
import type { Movimentacao, MovimentacaoComAutor, StatusItem, TipoItem, TipoMovimentacao } from '../../database/types.js'
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

type HistoricoRow = RowDataPacket & {
  id_item_solicitado: number
  id_solicitacao: number
  numero_protocolo: string
  solicitante: string | null
  matricula: string | null
  nome_item: string
  id_chave: number | null
  sala: string
  status_item: StatusItem
  motivo_recusa: string | null
  decidido_por: string | null
  data_hora_decisao: string | null
  retirada_em: string | null
  retirada_por: string | null
  retirada_responsavel: string | null
  retirada_observacao: string | null
  devolucao_em: string | null
  devolucao_por: string | null
  devolucao_responsavel: string | null
  devolucao_observacao: string | null
  teve_atraso: number
}

export type RegistroMovimento = { em: string; por: string | null; responsavel: string | null; observacao: string | null }

export type ItemHistorico = {
  itemId: string
  solicitacaoId: string
  protocolo: string
  solicitanteNome: string | null
  matricula: string | null
  itemNome: string
  tipoItem: TipoItem
  sala: string
  status: StatusItem
  motivoRecusa: string | null
  decididoPor: string | null
  decididoEm: string | null
  retirada: RegistroMovimento | null
  devolucao: RegistroMovimento | null
  teveAtraso: boolean
}

export type FiltrosHistorico = {
  search?: string
  status?: StatusItem
  material?: string
  room?: string
  from?: string
  to?: string
}

/** Texto digitado vira busca literal: % e _ não funcionam como curingas do LIKE. */
const contem = (texto: string) => `%${texto.replace(/[\\%_]/g, '\\$&')}%`

const registro = (
  em: string | null,
  por: string | null,
  responsavel: string | null,
  observacao: string | null,
): RegistroMovimento | null => (em ? { em: fromDbDateTime(em), por, responsavel, observacao } : null)

export const movimentacaoRepository = {
  /** Um registro por item solicitado, com ou sem movimentação: é o que a tela de histórico mostra. */
  async listHistorico(filtros: FiltrosHistorico, db: Db = pool): Promise<ItemHistorico[]> {
    const where: string[] = []
    const params: unknown[] = []
    if (filtros.search) {
      where.push('(s.numero_protocolo LIKE ? OR u.nome LIKE ? OR u.matricula LIKE ? OR i.nome_item LIKE ?)')
      params.push(...Array<string>(4).fill(contem(filtros.search)))
    }
    if (filtros.status) {
      where.push('i.status_item = ?')
      params.push(filtros.status)
    }
    if (filtros.material) {
      where.push('i.nome_item LIKE ?')
      params.push(contem(filtros.material))
    }
    if (filtros.room) {
      where.push('sl.codigo LIKE ?')
      params.push(contem(filtros.room))
    }
    if (filtros.from) {
      where.push('s.data_utilizacao >= ?')
      params.push(filtros.from)
    }
    if (filtros.to) {
      where.push('s.data_utilizacao <= ?')
      params.push(filtros.to)
    }

    const [rows] = await db.query<HistoricoRow[]>(
      `SELECT i.id_item_solicitado, i.id_solicitacao, s.numero_protocolo, u.nome AS solicitante, u.matricula,
              i.nome_item, i.id_chave, sl.codigo AS sala, i.status_item, i.motivo_recusa,
              ud.nome AS decidido_por, i.data_hora_decisao,
              mr.data_hora_real AS retirada_em, ur.nome AS retirada_por,
              mr.responsavel AS retirada_responsavel, mr.observacao AS retirada_observacao,
              md.data_hora_real AS devolucao_em, ue.nome AS devolucao_por,
              md.responsavel AS devolucao_responsavel, md.observacao AS devolucao_observacao,
              a.id_atraso IS NOT NULL AS teve_atraso
       FROM item_solicitado i
       JOIN solicitacao s ON s.id_solicitacao = i.id_solicitacao
       JOIN sala sl ON sl.id_sala = s.id_sala
       LEFT JOIN usuario u ON u.id_usuario = s.id_usuario_solicitante
       LEFT JOIN usuario ud ON ud.id_usuario = i.id_coordenador_decisao
       LEFT JOIN movimentacao mr ON mr.id_item_solicitado = i.id_item_solicitado AND mr.tipo_movimentacao = 'RETIRADA'
       LEFT JOIN usuario ur ON ur.id_usuario = mr.id_coordenador
       LEFT JOIN movimentacao md ON md.id_item_solicitado = i.id_item_solicitado AND md.tipo_movimentacao = 'DEVOLUCAO'
       LEFT JOIN usuario ue ON ue.id_usuario = md.id_coordenador
       LEFT JOIN ocorrencia_atraso a ON a.id_item_solicitado = i.id_item_solicitado
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY s.data_utilizacao DESC, s.id_solicitacao DESC, i.id_item_solicitado`,
      params,
    )

    return rows.map((row) => ({
      itemId: String(row.id_item_solicitado),
      solicitacaoId: String(row.id_solicitacao),
      protocolo: row.numero_protocolo,
      solicitanteNome: row.solicitante,
      matricula: row.matricula,
      itemNome: row.nome_item,
      tipoItem: row.id_chave === null ? 'MATERIAL' : 'CHAVE',
      sala: row.sala,
      status: row.status_item,
      motivoRecusa: row.motivo_recusa,
      decididoPor: row.decidido_por,
      decididoEm: row.data_hora_decisao ? fromDbDateTime(row.data_hora_decisao) : null,
      retirada: registro(row.retirada_em, row.retirada_por, row.retirada_responsavel, row.retirada_observacao),
      devolucao: registro(row.devolucao_em, row.devolucao_por, row.devolucao_responsavel, row.devolucao_observacao),
      teveAtraso: row.teve_atraso === 1,
    }))
  },

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

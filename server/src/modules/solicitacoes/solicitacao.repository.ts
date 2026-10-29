import { randomUUID } from 'node:crypto'
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { pool } from '../../database/connection.js'
import { parseId, toHm, type Db } from '../../database/sql.js'
import type { ItemSolicitacao, Sala, Solicitacao, StatusItem, TipoItem } from '../../database/types.js'
import { fromDbDateTime, toDbDateTime } from '../../utils/dates.js'
import { chaveRepository } from '../chaves/chave.repository.js'

export type ItemDoUsuario = ItemSolicitacao & {
  solicitacaoId: string
  solicitadoEm: string
}

type SolicitacaoRow = RowDataPacket & {
  id_solicitacao: number
  id_usuario_solicitante: number
  id_sala: number
  numero_protocolo: string
  data_solicitacao: string
  data_utilizacao: string
  hora_retirada_prevista: string
  hora_devolucao_prevista: string
  observacoes: string | null
}

type ItemRow = RowDataPacket & {
  id_item_solicitado: number
  id_solicitacao: number
  id_material: number | null
  id_chave: number | null
  id_coordenador_decisao: number | null
  quantidade_solicitada: number
  status_item: StatusItem
  motivo_recusa: string | null
  nome_item: string
  detalhe_item: string | null
  data_hora_atualizacao: string
}

export type CabecalhoSolicitacao = Omit<Solicitacao, 'itens'>

const toItem = (row: ItemRow): ItemSolicitacao => ({
  id: String(row.id_item_solicitado),
  tipo: row.id_material !== null ? 'MATERIAL' : 'CHAVE',
  referenciaId: String(row.id_material ?? row.id_chave),
  nome: row.nome_item,
  detalhe: row.detalhe_item ?? undefined,
  quantidade: row.quantidade_solicitada,
  status: row.status_item,
  atualizadoEm: fromDbDateTime(row.data_hora_atualizacao),
  motivoRecusa: row.motivo_recusa ?? undefined,
  decididoPorId: row.id_coordenador_decisao === null ? undefined : String(row.id_coordenador_decisao),
})

const toCabecalho = (row: SolicitacaoRow): CabecalhoSolicitacao => ({
  id: String(row.id_solicitacao),
  protocolo: row.numero_protocolo,
  usuarioId: String(row.id_usuario_solicitante),
  criadoEm: fromDbDateTime(row.data_solicitacao),
  salaId: String(row.id_sala),
  dataUtilizacao: row.data_utilizacao,
  retiradaPrevista: toHm(row.hora_retirada_prevista),
  devolucaoPrevista: toHm(row.hora_devolucao_prevista),
  observacoes: row.observacoes ?? undefined,
})

const COLUNAS_SOLICITACAO = `s.id_solicitacao, s.id_usuario_solicitante, s.id_sala, s.numero_protocolo, s.data_solicitacao,
  s.data_utilizacao, s.hora_retirada_prevista, s.hora_devolucao_prevista, s.observacoes`

/** Carrega as solicitações que combinam com o filtro, já com os itens (duas consultas, sem N+1). */
async function carregar(db: Db, where: string, params: unknown[]): Promise<Solicitacao[]> {
  const [rows] = await db.query<SolicitacaoRow[]>(
    `SELECT ${COLUNAS_SOLICITACAO} FROM solicitacao s ${where} ORDER BY s.data_solicitacao DESC, s.id_solicitacao DESC`,
    params,
  )
  if (rows.length === 0) return []

  const [itens] = await db.query<ItemRow[]>(
    'SELECT * FROM item_solicitado WHERE id_solicitacao IN (?) ORDER BY id_item_solicitado',
    [rows.map((row) => row.id_solicitacao)],
  )
  const porSolicitacao = new Map<number, ItemSolicitacao[]>()
  for (const item of itens) {
    const lista = porSolicitacao.get(item.id_solicitacao) ?? []
    lista.push(toItem(item))
    porSolicitacao.set(item.id_solicitacao, lista)
  }
  return rows.map((row) => ({ ...toCabecalho(row), itens: porSolicitacao.get(row.id_solicitacao) ?? [] }))
}

/** Situação geral da solicitação (coluna status_geral do MER), calculada a partir dos itens. */
export function derivarStatusGeral(
  statuses: StatusItem[],
): 'PENDENTE' | 'APROVADA' | 'PARCIAL' | 'RECUSADA' | 'FINALIZADA' {
  if (statuses.every((status) => status === 'PENDENTE')) return 'PENDENTE'
  if (statuses.every((status) => status === 'RECUSADO')) return 'RECUSADA'
  if (statuses.every((status) => status === 'DEVOLVIDO' || status === 'RECUSADO')) return 'FINALIZADA'
  if (statuses.some((status) => status === 'PENDENTE' || status === 'RECUSADO')) return 'PARCIAL'
  return 'APROVADA'
}

export type NovaSolicitacao = {
  usuarioId: string
  sala: Sala
  dataUtilizacao: string
  retiradaPrevista: string
  devolucaoPrevista: string
  observacoes?: string
  now: Date
  itens: {
    tipo: TipoItem
    referenciaId: string
    nome: string
    detalhe?: string
    quantidade: number
  }[]
}

export const solicitacaoRepository = {
  async listAll(db: Db = pool): Promise<Solicitacao[]> {
    return carregar(db, '', [])
  },

  /** Solicitações do usuário, da mais recente para a mais antiga. */
  async listByUsuario(usuarioId: string, db: Db = pool): Promise<Solicitacao[]> {
    return carregar(db, 'WHERE s.id_usuario_solicitante = ?', [parseId(usuarioId) ?? 0])
  },

  async findById(id: string, db: Db = pool): Promise<Solicitacao | undefined> {
    const numericId = parseId(id)
    if (numericId === undefined) return undefined
    return (await carregar(db, 'WHERE s.id_solicitacao = ?', [numericId]))[0]
  },

  /** Detalhes de uma solicitação, limitados ao dono dela, com as movimentações reais. */
  async detailsByUsuario(id: string, usuarioId: string, db: Db = pool) {
    const solicitacao = await this.findById(id, db)
    if (!solicitacao || solicitacao.usuarioId !== usuarioId) return undefined

    const [movimentos] = await db.query<
      (RowDataPacket & {
        id_movimentacao: number
        id_item_solicitado: number
        nome_item: string
        tipo_movimentacao: 'RETIRADA' | 'DEVOLUCAO'
        data_hora_real: string
        responsavel: string | null
        atendente: string | null
        observacao: string | null
      })[]
    >(
      `SELECT m.id_movimentacao, m.id_item_solicitado, i.nome_item, m.tipo_movimentacao, m.data_hora_real,
              m.responsavel, u.nome AS atendente, m.observacao
       FROM movimentacao m
       JOIN item_solicitado i ON i.id_item_solicitado = m.id_item_solicitado
       LEFT JOIN usuario u ON u.id_usuario = m.id_coordenador
       WHERE i.id_solicitacao = ? ORDER BY m.data_hora_real, m.id_movimentacao`,
      [parseId(id) ?? 0],
    )

    const salas = await chaveRepository.listSalas(db)
    return {
      solicitacao,
      salas,
      movements: movimentos.map((m) => ({
        id: String(m.id_movimentacao),
        itemId: String(m.id_item_solicitado),
        itemName: m.nome_item,
        type: m.tipo_movimentacao,
        registeredAt: fromDbDateTime(m.data_hora_real),
        responsible: m.responsavel ?? '',
        attendant: m.atendente ?? 'Não informado',
        notes: m.observacao ?? null,
      })),
    }
  },

  /** Todos os itens de todas as solicitações do usuário, já "achatados". */
  async listItensByUsuario(usuarioId: string, db: Db = pool): Promise<ItemDoUsuario[]> {
    const solicitacoes = await this.listByUsuario(usuarioId, db)
    return solicitacoes.flatMap((solicitacao) =>
      solicitacao.itens.map((item) => ({ ...item, solicitacaoId: solicitacao.id, solicitadoEm: solicitacao.criadoEm })),
    )
  },

  /**
   * Grava a solicitação e os itens. Deve rodar dentro de uma transação (quem chama confere a
   * disponibilidade na mesma transação, para ninguém reservar o mesmo item no meio).
   */
  async create(data: NovaSolicitacao, db: Db): Promise<Solicitacao> {
    const agora = toDbDateTime(data.now)
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO solicitacao (id_usuario_solicitante, id_sala, numero_protocolo, data_solicitacao, data_utilizacao,
         hora_retirada_prevista, hora_devolucao_prevista, local_utilizacao, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseId(data.usuarioId) ?? 0,
        parseId(data.sala.id) ?? 0,
        `TMP-${randomUUID()}`, // trocado logo abaixo pelo número definitivo, que usa o id gerado
        agora,
        data.dataUtilizacao,
        `${data.retiradaPrevista}:00`,
        `${data.devolucaoPrevista}:00`,
        `${data.sala.codigo} · ${data.sala.nome}`,
        data.observacoes ?? null,
      ],
    )
    const id = result.insertId
    const protocolo = `CCT-${data.dataUtilizacao.slice(0, 4)}-${String(id).padStart(5, '0')}`
    await db.execute('UPDATE solicitacao SET numero_protocolo = ? WHERE id_solicitacao = ?', [protocolo, id])

    for (const item of data.itens) {
      await db.execute(
        `INSERT INTO item_solicitado (id_solicitacao, id_material, id_chave, quantidade_solicitada, nome_item,
           detalhe_item, data_hora_atualizacao)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          item.tipo === 'MATERIAL' ? (parseId(item.referenciaId) ?? null) : null,
          item.tipo === 'CHAVE' ? (parseId(item.referenciaId) ?? null) : null,
          item.quantidade,
          item.nome,
          item.detalhe ?? null,
          agora,
        ],
      )
    }

    return (await this.findById(String(id), db))!
  },

  /** Busca o item travando a linha (SELECT ... FOR UPDATE): ninguém mais decide o mesmo item enquanto a transação não termina. */
  async findItemForUpdate(
    solicitacaoId: string,
    itemId: string,
    db: Db,
  ): Promise<{ solicitacao: CabecalhoSolicitacao; item: ItemSolicitacao } | undefined> {
    const idSolicitacao = parseId(solicitacaoId)
    const idItem = parseId(itemId)
    if (idSolicitacao === undefined || idItem === undefined) return undefined

    const [itens] = await db.execute<ItemRow[]>(
      'SELECT * FROM item_solicitado WHERE id_item_solicitado = ? AND id_solicitacao = ? FOR UPDATE',
      [idItem, idSolicitacao],
    )
    if (!itens[0]) return undefined
    const [cabecalhos] = await db.execute<SolicitacaoRow[]>(
      `SELECT ${COLUNAS_SOLICITACAO} FROM solicitacao s WHERE s.id_solicitacao = ?`,
      [idSolicitacao],
    )
    return { solicitacao: toCabecalho(cabecalhos[0]!), item: toItem(itens[0]) }
  },

  async updateItem(
    itemId: string,
    change: {
      status: StatusItem
      /** Se omitido, a data da última mudança não é alterada (ex.: marcar atraso). */
      atualizadoEm?: Date
      motivoRecusa?: string
      decididoPorId?: string
    },
    db: Db,
  ): Promise<void> {
    const sets = ['status_item = ?']
    const params: (string | number | null)[] = [change.status]
    if (change.atualizadoEm) {
      sets.push('data_hora_atualizacao = ?')
      params.push(toDbDateTime(change.atualizadoEm))
    }
    if (change.decididoPorId !== undefined) {
      sets.push('id_coordenador_decisao = ?', 'data_hora_decisao = ?', 'motivo_recusa = ?')
      params.push(parseId(change.decididoPorId) ?? 0, toDbDateTime(change.atualizadoEm ?? new Date()), change.motivoRecusa ?? null)
    }
    await db.execute(`UPDATE item_solicitado SET ${sets.join(', ')} WHERE id_item_solicitado = ?`, [...params, parseId(itemId) ?? 0])
  },

  /** Recalcula o status_geral da solicitação depois que um item muda. */
  async refreshStatusGeral(solicitacaoId: string, db: Db): Promise<void> {
    const id = parseId(solicitacaoId) ?? 0
    const [rows] = await db.execute<(RowDataPacket & { status_item: StatusItem })[]>(
      'SELECT status_item FROM item_solicitado WHERE id_solicitacao = ?',
      [id],
    )
    if (rows.length === 0) return
    await db.execute('UPDATE solicitacao SET status_geral = ? WHERE id_solicitacao = ?', [
      derivarStatusGeral(rows.map((row) => row.status_item)),
      id,
    ])
  },
}

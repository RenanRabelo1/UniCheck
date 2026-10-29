import type { RowDataPacket } from 'mysql2/promise'
import { pool } from '../../database/connection.js'
import { parseId, type Db } from '../../database/sql.js'
import type { TipoItem } from '../../database/types.js'
import { STATUS_QUE_OCUPAM } from './solicitacao.status.js'

export type Janela = {
  /** AAAA-MM-DD */
  data: string
  /** HH:mm */
  inicio: string
  /** HH:mm */
  fim: string
}

const OCUPAM = STATUS_QUE_OCUPAM.map((status) => `'${status}'`).join(', ')

// Material e chave ficam em colunas diferentes de item_solicitado.
const coluna = (tipo: TipoItem) => (tipo === 'MATERIAL' ? 'i.id_material' : 'i.id_chave')

/**
 * Dois intervalos se sobrepõem quando cada um começa antes de o outro terminar:
 * (retirada da solicitação < fim pedido) E (início pedido < devolução da solicitação).
 */
const SOBREPOE = 's.hora_retirada_prevista < ? AND ? < s.hora_devolucao_prevista'

/** Quantas unidades de cada material/chave já estão comprometidas na janela pedida. Chave: id do item -> quantidade. */
export async function ocupacaoNaJanela(tipo: TipoItem, janela: Janela, db: Db = pool): Promise<Map<string, number>> {
  const [rows] = await db.query<(RowDataPacket & { ref: number; total: string })[]>(
    `SELECT ${coluna(tipo)} AS ref, SUM(i.quantidade_solicitada) AS total
     FROM item_solicitado i JOIN solicitacao s ON s.id_solicitacao = i.id_solicitacao
     WHERE ${coluna(tipo)} IS NOT NULL AND i.status_item IN (${OCUPAM})
       AND s.data_utilizacao = ? AND ${SOBREPOE}
     GROUP BY ${coluna(tipo)}`,
    [janela.data, `${janela.fim}:00`, `${janela.inicio}:00`],
  )
  return new Map(rows.map((row) => [String(row.ref), Number(row.total)]))
}

/** Quantas unidades daquele material/chave já estão comprometidas na janela pedida. */
export async function quantidadeOcupada(tipo: TipoItem, referenciaId: string, janela: Janela, db: Db = pool): Promise<number> {
  const id = parseId(referenciaId)
  if (id === undefined) return 0
  const [rows] = await db.query<(RowDataPacket & { total: string })[]>(
    `SELECT COALESCE(SUM(i.quantidade_solicitada), 0) AS total
     FROM item_solicitado i JOIN solicitacao s ON s.id_solicitacao = i.id_solicitacao
     WHERE ${coluna(tipo)} = ? AND i.status_item IN (${OCUPAM})
       AND s.data_utilizacao = ? AND ${SOBREPOE}`,
    [id, janela.data, `${janela.fim}:00`, `${janela.inicio}:00`],
  )
  return Number(rows[0]?.total ?? 0)
}

/** O material/chave tem algum item aprovado ou em posse? (de qualquer data) */
export async function temItemEmAndamento(tipo: TipoItem, referenciaId: string, db: Db = pool): Promise<boolean> {
  const id = parseId(referenciaId)
  if (id === undefined) return false
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT 1 FROM item_solicitado i WHERE ${coluna(tipo)} = ? AND i.status_item IN (${OCUPAM}) LIMIT 1`,
    [id],
  )
  return rows.length > 0
}

/** Soma das unidades aprovadas ou em posse, de `aPartirDe` (AAAA-MM-DD) em diante. */
export async function quantidadeComprometida(tipo: TipoItem, referenciaId: string, aPartirDe: string, db: Db = pool): Promise<number> {
  const id = parseId(referenciaId)
  if (id === undefined) return 0
  const [rows] = await db.query<(RowDataPacket & { total: string })[]>(
    `SELECT COALESCE(SUM(i.quantidade_solicitada), 0) AS total
     FROM item_solicitado i JOIN solicitacao s ON s.id_solicitacao = i.id_solicitacao
     WHERE ${coluna(tipo)} = ? AND i.status_item IN (${OCUPAM}) AND s.data_utilizacao >= ?`,
    [id, aPartirDe],
  )
  return Number(rows[0]?.total ?? 0)
}

/** Comprometido de TODOS os materiais de uma vez (tela de estoque): id do material -> quantidade. */
export async function comprometidoPorMaterial(aPartirDe: string, db: Db = pool): Promise<Map<string, number>> {
  const [rows] = await db.query<(RowDataPacket & { ref: number; total: string })[]>(
    `SELECT i.id_material AS ref, SUM(i.quantidade_solicitada) AS total
     FROM item_solicitado i JOIN solicitacao s ON s.id_solicitacao = i.id_solicitacao
     WHERE i.id_material IS NOT NULL AND i.status_item IN (${OCUPAM}) AND s.data_utilizacao >= ?
     GROUP BY i.id_material`,
    [aPartirDe],
  )
  return new Map(rows.map((row) => [String(row.ref), Number(row.total)]))
}

/**
 * Trava (SELECT ... FOR UPDATE) as linhas dos materiais/chaves de um pedido.
 * Quem chega depois espera a transação anterior terminar e então enxerga o estoque já atualizado.
 * A ordem fixa evita que duas transações se travem uma à outra (deadlock).
 */
export async function travarItens(itens: { tipo: TipoItem; referenciaId: string }[], db: Db): Promise<void> {
  const ordenados = [...itens].sort((a, b) => `${a.tipo}${a.referenciaId.padStart(15, '0')}`.localeCompare(`${b.tipo}${b.referenciaId.padStart(15, '0')}`))
  for (const item of ordenados) {
    const id = parseId(item.referenciaId)
    if (id === undefined) continue
    const sql = item.tipo === 'MATERIAL' ? 'SELECT 1 FROM material WHERE id_material = ? FOR UPDATE' : 'SELECT 1 FROM chave WHERE id_chave = ? FOR UPDATE'
    await db.query(sql, [id])
  }
}

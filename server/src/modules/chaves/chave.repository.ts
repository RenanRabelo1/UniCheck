import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { pool } from '../../database/connection.js'
import { parseId, type Db } from '../../database/sql.js'
import type { Chave, Sala, TipoChave } from '../../database/types.js'
import { STATUS_QUE_OCUPAM } from '../solicitacoes/solicitacao.status.js'

type SalaRow = RowDataPacket & { id_sala: number; codigo: string; descricao: string | null; status: 'ATIVA' | 'INATIVA' }
type ChaveRow = RowDataPacket & {
  id_chave: number
  id_sala: number
  tipo_chave: TipoChave
  status: 'ATIVA' | 'INATIVA' | 'MANUTENCAO'
}

const toSala = (row: SalaRow): Sala => ({
  id: String(row.id_sala),
  codigo: row.codigo,
  // O MER chama o nome da sala de "descricao".
  nome: row.descricao ?? row.codigo,
  ativo: row.status === 'ATIVA',
})

const toChave = (row: ChaveRow): Chave => ({
  id: String(row.id_chave),
  salaId: String(row.id_sala),
  tipo: row.tipo_chave,
  ativo: row.status === 'ATIVA',
})

const OCUPAM = STATUS_QUE_OCUPAM.map((status) => `'${status}'`).join(', ')

export const chaveRepository = {
  // ---- salas ----

  /** Todas as salas, inclusive inativas (necessário para mostrar solicitações antigas). */
  async listSalas(db: Db = pool): Promise<Sala[]> {
    const [rows] = await db.query<SalaRow[]>('SELECT id_sala, codigo, descricao, status FROM sala ORDER BY codigo')
    return rows.map(toSala)
  },

  async listSalasAtivas(db: Db = pool): Promise<Sala[]> {
    const [rows] = await db.query<SalaRow[]>("SELECT id_sala, codigo, descricao, status FROM sala WHERE status = 'ATIVA' ORDER BY codigo")
    return rows.map(toSala)
  },

  async findSala(id: string, db: Db = pool): Promise<Sala | undefined> {
    const numericId = parseId(id)
    if (numericId === undefined) return undefined
    const [rows] = await db.execute<SalaRow[]>('SELECT id_sala, codigo, descricao, status FROM sala WHERE id_sala = ?', [numericId])
    return rows[0] ? toSala(rows[0]) : undefined
  },

  async findActiveSala(id: string, db: Db = pool): Promise<Sala | undefined> {
    const sala = await this.findSala(id, db)
    return sala?.ativo ? sala : undefined
  },

  async salaCodigoExists(codigo: string, exceptId: string | undefined, db: Db = pool): Promise<boolean> {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT id_sala FROM sala WHERE UPPER(codigo) = UPPER(?) AND id_sala <> ?', [
      codigo,
      parseId(exceptId ?? '') ?? 0,
    ])
    return rows.length > 0
  },

  async createSala(data: { codigo: string; nome: string }, db: Db = pool): Promise<Sala> {
    const bloco = data.codigo.split('-')[0] ?? data.codigo
    const [result] = await db.execute<ResultSetHeader>('INSERT INTO sala (codigo, bloco, descricao) VALUES (?, ?, ?)', [
      data.codigo,
      bloco,
      data.nome,
    ])
    return { id: String(result.insertId), codigo: data.codigo, nome: data.nome, ativo: true }
  },

  async updateSala(id: string, data: { codigo: string; nome: string; ativo: boolean }, db: Db = pool): Promise<void> {
    await db.execute('UPDATE sala SET codigo = ?, descricao = ?, status = ? WHERE id_sala = ?', [
      data.codigo,
      data.nome,
      data.ativo ? 'ATIVA' : 'INATIVA',
      parseId(id) ?? 0,
    ])
  },

  /** A sala tem algum item aprovado ou em posse? (então não pode ser inativada) */
  async salaEmUso(id: string, db: Db = pool): Promise<boolean> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT 1 FROM item_solicitado i JOIN solicitacao s ON s.id_solicitacao = i.id_solicitacao
       WHERE s.id_sala = ? AND i.status_item IN (${OCUPAM}) LIMIT 1`,
      [parseId(id) ?? 0],
    )
    return rows.length > 0
  },

  // ---- chaves ----

  async listAll(db: Db = pool): Promise<Chave[]> {
    const [rows] = await db.query<ChaveRow[]>('SELECT id_chave, id_sala, tipo_chave, status FROM chave ORDER BY id_chave')
    return rows.map(toChave)
  },

  async listActive(db: Db = pool): Promise<Chave[]> {
    const [rows] = await db.query<ChaveRow[]>("SELECT id_chave, id_sala, tipo_chave, status FROM chave WHERE status = 'ATIVA' ORDER BY id_chave")
    return rows.map(toChave)
  },

  async findChave(id: string, db: Db = pool): Promise<Chave | undefined> {
    const numericId = parseId(id)
    if (numericId === undefined) return undefined
    const [rows] = await db.execute<ChaveRow[]>('SELECT id_chave, id_sala, tipo_chave, status FROM chave WHERE id_chave = ?', [numericId])
    return rows[0] ? toChave(rows[0]) : undefined
  },

  async findActiveById(id: string, db: Db = pool): Promise<Chave | undefined> {
    const chave = await this.findChave(id, db)
    return chave?.ativo ? chave : undefined
  },

  /** Uma sala tem no máximo uma chave de cada tipo (primária e secundária). */
  async chaveDaSalaExists(salaId: string, tipo: TipoChave, db: Db = pool): Promise<boolean> {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT id_chave FROM chave WHERE id_sala = ? AND tipo_chave = ?', [
      parseId(salaId) ?? 0,
      tipo,
    ])
    return rows.length > 0
  },

  async createChave(data: { sala: Sala; tipo: TipoChave }, db: Db = pool): Promise<Chave> {
    // O MER pede um código único por chave: "J-204-P" (primária) ou "J-204-S" (secundária).
    const codigo = `${data.sala.codigo}-${data.tipo === 'PRIMARIA' ? 'P' : 'S'}`
    const [result] = await db.execute<ResultSetHeader>('INSERT INTO chave (id_sala, codigo, tipo_chave) VALUES (?, ?, ?)', [
      parseId(data.sala.id) ?? 0,
      codigo,
      data.tipo,
    ])
    return { id: String(result.insertId), salaId: data.sala.id, tipo: data.tipo, ativo: true }
  },

  async setChaveAtiva(id: string, ativo: boolean, db: Db = pool): Promise<void> {
    await db.execute('UPDATE chave SET status = ? WHERE id_chave = ?', [ativo ? 'ATIVA' : 'INATIVA', parseId(id) ?? 0])
  },
}

import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { pool } from '../../database/connection.js'
import { parseId, type Db } from '../../database/sql.js'
import type { Material } from '../../database/types.js'

type MaterialRow = RowDataPacket & {
  id_material: number
  nome: string
  detalhe: string | null
  quantidade_total: number
  status: 'ATIVO' | 'INATIVO' | 'MANUTENCAO'
}

const COLUNAS = 'id_material, nome, detalhe, quantidade_total, status'

const toMaterial = (row: MaterialRow): Material => ({
  id: String(row.id_material),
  nome: row.nome,
  detalhe: row.detalhe ?? undefined,
  quantidadeTotal: row.quantidade_total,
  ativo: row.status === 'ATIVO',
})

export const materialRepository = {
  async listAll(db: Db = pool): Promise<Material[]> {
    const [rows] = await db.query<MaterialRow[]>(`SELECT ${COLUNAS} FROM material ORDER BY nome, detalhe`)
    return rows.map(toMaterial)
  },

  async listActive(db: Db = pool): Promise<Material[]> {
    const [rows] = await db.query<MaterialRow[]>(`SELECT ${COLUNAS} FROM material WHERE status = 'ATIVO' ORDER BY nome, detalhe`)
    return rows.map(toMaterial)
  },

  async findById(id: string, db: Db = pool): Promise<Material | undefined> {
    const numericId = parseId(id)
    if (numericId === undefined) return undefined
    const [rows] = await db.execute<MaterialRow[]>(`SELECT ${COLUNAS} FROM material WHERE id_material = ?`, [numericId])
    return rows[0] ? toMaterial(rows[0]) : undefined
  },

  async findActiveById(id: string, db: Db = pool): Promise<Material | undefined> {
    const material = await this.findById(id, db)
    return material?.ativo ? material : undefined
  },

  /** Dois materiais são "o mesmo" quando têm o mesmo nome e o mesmo detalhe (ex.: patrimônio). */
  async sameExists(nome: string, detalhe: string | undefined, exceptId: string | undefined, db: Db = pool): Promise<boolean> {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id_material FROM material
       WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?)) AND LOWER(TRIM(COALESCE(detalhe, ''))) = LOWER(TRIM(?)) AND id_material <> ?`,
      [nome, detalhe ?? '', parseId(exceptId ?? '') ?? 0],
    )
    return rows.length > 0
  },

  async create(data: { nome: string; detalhe?: string; quantidadeTotal: number }, db: Db = pool): Promise<Material> {
    const [result] = await db.execute<ResultSetHeader>(
      // O MER separa materiais "individuais" (com patrimônio) dos "por quantidade". Aqui todos são por quantidade;
      // a disponibilidade é calculada pelas solicitações, então quantidade_disponivel fica vazia.
      `INSERT INTO material (nome, categoria, tipo_controle, detalhe, quantidade_total)
       VALUES (?, 'Geral', 'QUANTIDADE', ?, ?)`,
      [data.nome, data.detalhe ?? null, data.quantidadeTotal],
    )
    return { id: String(result.insertId), nome: data.nome, detalhe: data.detalhe, quantidadeTotal: data.quantidadeTotal, ativo: true }
  },

  async update(id: string, data: Omit<Material, 'id'>, db: Db = pool): Promise<void> {
    await db.execute('UPDATE material SET nome = ?, detalhe = ?, quantidade_total = ?, status = ? WHERE id_material = ?', [
      data.nome,
      data.detalhe ?? null,
      data.quantidadeTotal,
      data.ativo ? 'ATIVO' : 'INATIVO',
      parseId(id) ?? 0,
    ])
  },
}

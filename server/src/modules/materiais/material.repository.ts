import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { pool } from '../../database/connection.js'
import { parseId, type Db } from '../../database/sql.js'
import type { ControleMaterial, Material } from '../../database/types.js'

type MaterialRow = RowDataPacket & {
  id_material: number
  nome: string
  categoria: string
  tipo_controle: ControleMaterial
  patrimonio: string | null
  detalhe: string | null
  quantidade_total: number
  status: 'ATIVO' | 'INATIVO' | 'MANUTENCAO'
}

const COLUNAS = 'id_material, nome, categoria, tipo_controle, patrimonio, detalhe, quantidade_total, status'

const toMaterial = (row: MaterialRow): Material => ({
  id: String(row.id_material),
  nome: row.nome,
  categoria: row.categoria,
  controle: row.tipo_controle,
  patrimonio: row.patrimonio ?? undefined,
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

  /** Dois materiais são "o mesmo" quando têm o mesmo nome, detalhe e patrimônio. */
  async sameExists(
    nome: string,
    detalhe: string | undefined,
    patrimonio: string | undefined,
    exceptId: string | undefined,
    db: Db = pool,
  ): Promise<boolean> {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id_material FROM material
       WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?)) AND LOWER(TRIM(COALESCE(detalhe, ''))) = LOWER(TRIM(?))
         AND COALESCE(patrimonio, '') = ? AND id_material <> ?`,
      [nome, detalhe ?? '', patrimonio ?? '', parseId(exceptId ?? '') ?? 0],
    )
    return rows.length > 0
  },

  async patrimonioExists(patrimonio: string, exceptId: string | undefined, db: Db = pool): Promise<boolean> {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT id_material FROM material WHERE patrimonio = ? AND id_material <> ?', [
      patrimonio,
      parseId(exceptId ?? '') ?? 0,
    ])
    return rows.length > 0
  },

  async create(data: Omit<Material, 'id' | 'ativo'>, db: Db = pool): Promise<Material> {
    const [result] = await db.execute<ResultSetHeader>(
      // A disponibilidade é calculada pelas solicitações, então quantidade_disponivel fica vazia.
      `INSERT INTO material (nome, categoria, tipo_controle, patrimonio, detalhe, quantidade_total)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.nome, data.categoria, data.controle, data.patrimonio ?? null, data.detalhe ?? null, data.quantidadeTotal],
    )
    return { id: String(result.insertId), ...data, ativo: true }
  },

  async update(id: string, data: Omit<Material, 'id' | 'controle'>, db: Db = pool): Promise<void> {
    await db.execute(
      'UPDATE material SET nome = ?, categoria = ?, patrimonio = ?, detalhe = ?, quantidade_total = ?, status = ? WHERE id_material = ?',
      [
        data.nome,
        data.categoria,
        data.patrimonio ?? null,
        data.detalhe ?? null,
        data.quantidadeTotal,
        data.ativo ? 'ATIVO' : 'INATIVO',
        parseId(id) ?? 0,
      ],
    )
  },
}

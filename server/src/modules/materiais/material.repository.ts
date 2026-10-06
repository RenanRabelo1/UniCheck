import { readDatabase, updateDatabase } from '../../database/jsonDatabase.js'
import type { Database, Material } from '../../database/types.js'

export const materialRepository = {
  async listAll(): Promise<Material[]> {
    const { materiais } = await readDatabase()
    return materiais
  },

  async listActive(): Promise<Material[]> {
    const { materiais } = await readDatabase()
    return materiais.filter((material) => material.ativo)
  },

  async findActiveById(id: string): Promise<Material | undefined> {
    const { materiais } = await readDatabase()
    return materiais.find((material) => material.id === id && material.ativo)
  },

  /** O cadastro confere as solicitações (ex.: item em uso) e altera o material no mesmo passo. */
  transaction<T>(change: (database: Database) => T): Promise<T> {
    return updateDatabase(change)
  },
}

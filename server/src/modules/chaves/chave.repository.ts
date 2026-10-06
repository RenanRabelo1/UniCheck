import { readDatabase, updateDatabase } from '../../database/jsonDatabase.js'
import type { Chave, Database, Sala } from '../../database/types.js'

export const chaveRepository = {
  /** Todas as salas, inclusive inativas (necessário para mostrar solicitações antigas). */
  async listSalas(): Promise<Sala[]> {
    const { salas } = await readDatabase()
    return salas
  },

  async listSalasAtivas(): Promise<Sala[]> {
    const { salas } = await readDatabase()
    return salas.filter((sala) => sala.ativo)
  },

  async findActiveSala(id: string): Promise<Sala | undefined> {
    const { salas } = await readDatabase()
    return salas.find((sala) => sala.id === id && sala.ativo)
  },

  async listAll(): Promise<Chave[]> {
    const { chaves } = await readDatabase()
    return chaves
  },

  async listActive(): Promise<Chave[]> {
    const { chaves } = await readDatabase()
    return chaves.filter((chave) => chave.ativo)
  },

  async findActiveById(id: string): Promise<Chave | undefined> {
    const { chaves } = await readDatabase()
    return chaves.find((chave) => chave.id === id && chave.ativo)
  },

  /** Cadastros de sala e chave mudam juntos (ex.: conferir a sala ao criar a chave). */
  transaction<T>(change: (database: Database) => T): Promise<T> {
    return updateDatabase(change)
  },
}

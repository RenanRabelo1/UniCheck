import { readDatabase, updateDatabase } from '../../database/jsonDatabase.js'
import type { Database, Movimentacao } from '../../database/types.js'

export const movimentacaoRepository = {
  /** Histórico, do registro mais recente para o mais antigo. */
  async list(filtros: { requestId?: string; itemId?: string }): Promise<Movimentacao[]> {
    const { movimentacoes } = await readDatabase()
    return movimentacoes
      .filter((mov) => !filtros.requestId || mov.solicitacaoId === filtros.requestId)
      .filter((mov) => !filtros.itemId || mov.itemId === filtros.itemId)
      .sort((a, b) => b.registradoEm.localeCompare(a.registradoEm))
  },

  /**
   * Transação que atravessa várias coleções: retirar um item muda o status do item
   * E cria a movimentação. Os dois acontecem juntos ou nenhum acontece.
   */
  transaction<T>(change: (database: Database) => T): Promise<T> {
    return updateDatabase(change)
  },
}

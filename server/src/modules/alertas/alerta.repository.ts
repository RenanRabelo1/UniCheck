import { readDatabase, updateDatabase } from '../../database/jsonDatabase.js'
import type { Alerta, Database } from '../../database/types.js'

export const alertaRepository = {
  /** Alertas, do mais recente para o mais antigo. `resolvido` omitido = todos. */
  async list(resolvido?: boolean): Promise<Alerta[]> {
    const { alertas } = await readDatabase()
    return alertas
      .filter((alerta) => resolvido === undefined || Boolean(alerta.resolvidoEm) === resolvido)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  },

  /** Marcar o item como atrasado e criar o alerta são um passo só. */
  transaction<T>(change: (database: Database) => T): Promise<T> {
    return updateDatabase(change)
  },
}

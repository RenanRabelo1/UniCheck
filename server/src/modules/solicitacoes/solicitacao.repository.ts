import { readDatabase, updateDatabase } from '../../database/jsonDatabase.js'
import type { ItemSolicitacao, Solicitacao } from '../../database/types.js'

export type ItemDoUsuario = ItemSolicitacao & {
  solicitacaoId: string
  solicitadoEm: string
}

export const solicitacaoRepository = {
  async listAll(): Promise<Solicitacao[]> {
    const { solicitacoes } = await readDatabase()
    return solicitacoes
  },

  /** Solicitações do usuário, da mais recente para a mais antiga. */
  async listByUsuario(usuarioId: string): Promise<Solicitacao[]> {
    const { solicitacoes } = await readDatabase()
    return solicitacoes
      .filter((solicitacao) => solicitacao.usuarioId === usuarioId)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
  },

  async findById(id: string): Promise<Solicitacao | undefined> {
    const { solicitacoes } = await readDatabase()
    return solicitacoes.find((solicitacao) => solicitacao.id === id)
  },

  async findByIdAndUsuario(id: string, usuarioId: string): Promise<Solicitacao | undefined> {
    const { solicitacoes } = await readDatabase()
    return solicitacoes.find((solicitacao) => solicitacao.id === id && solicitacao.usuarioId === usuarioId)
  },

  /** Todos os itens de todas as solicitações do usuário, já "achatados". */
  async listItensByUsuario(usuarioId: string): Promise<ItemDoUsuario[]> {
    const solicitacoes = await this.listByUsuario(usuarioId)
    return solicitacoes.flatMap((solicitacao) =>
      solicitacao.itens.map((item) => ({
        ...item,
        solicitacaoId: solicitacao.id,
        solicitadoEm: solicitacao.criadoEm,
      })),
    )
  },

  /**
   * Altera solicitações dentro de uma "transação": se `change` lançar erro, nada é gravado.
   * Usada pela análise do coordenador, que confere e altera o item no mesmo passo.
   */
  transaction<T>(change: (solicitacoes: Solicitacao[]) => T): Promise<T> {
    return updateDatabase((database) => change(database.solicitacoes))
  },

  /**
   * Cria uma solicitação dentro de uma "transação".
   * `build` recebe as solicitações que já existem e devolve a nova. Se ela lançar
   * um erro (ex.: item indisponível), nada é gravado. Assim a checagem de
   * disponibilidade e a gravação acontecem juntas, sem brecha entre uma e outra.
   */
  create(build: (existentes: Solicitacao[]) => Solicitacao): Promise<Solicitacao> {
    return updateDatabase((database) => {
      const nova = build(database.solicitacoes)
      database.solicitacoes.push(nova)
      return nova
    })
  },
}

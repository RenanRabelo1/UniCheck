import type { Solicitacao, TipoItem } from '../../database/types.js'
import { STATUS_QUE_OCUPAM } from './solicitacao.status.js'

export type Janela = {
  /** AAAA-MM-DD */
  data: string
  /** HH:mm */
  inicio: string
  /** HH:mm */
  fim: string
}

/**
 * Dois intervalos se sobrepõem quando cada um começa antes de o outro terminar.
 * Comparar "HH:mm" como texto funciona porque o formato tem sempre 5 caracteres.
 */
export function overlaps(aInicio: string, aFim: string, bInicio: string, bFim: string): boolean {
  return aInicio < bFim && bInicio < aFim
}

/** Quantas unidades daquele material/chave já estão comprometidas na janela pedida. */
export function quantidadeOcupada(
  solicitacoes: Solicitacao[],
  tipo: TipoItem,
  referenciaId: string,
  janela: Janela,
): number {
  let total = 0

  for (const solicitacao of solicitacoes) {
    if (solicitacao.dataUtilizacao !== janela.data) continue
    if (!overlaps(solicitacao.retiradaPrevista, solicitacao.devolucaoPrevista, janela.inicio, janela.fim)) continue

    for (const item of solicitacao.itens) {
      if (item.tipo === tipo && item.referenciaId === referenciaId && STATUS_QUE_OCUPAM.includes(item.status)) {
        total += item.quantidade
      }
    }
  }

  return total
}

/** O material/chave tem algum item aprovado ou em posse? (de qualquer data) */
export function temItemEmAndamento(solicitacoes: Solicitacao[], tipo: TipoItem, referenciaId: string): boolean {
  return solicitacoes.some((solicitacao) =>
    solicitacao.itens.some(
      (item) => item.tipo === tipo && item.referenciaId === referenciaId && STATUS_QUE_OCUPAM.includes(item.status),
    ),
  )
}

/** Soma das unidades aprovadas ou em posse, de `aPartirDe` (AAAA-MM-DD) em diante. */
export function quantidadeComprometida(
  solicitacoes: Solicitacao[],
  tipo: TipoItem,
  referenciaId: string,
  aPartirDe: string,
): number {
  let total = 0
  for (const solicitacao of solicitacoes) {
    if (solicitacao.dataUtilizacao < aPartirDe) continue
    for (const item of solicitacao.itens) {
      if (item.tipo === tipo && item.referenciaId === referenciaId && STATUS_QUE_OCUPAM.includes(item.status)) {
        total += item.quantidade
      }
    }
  }
  return total
}

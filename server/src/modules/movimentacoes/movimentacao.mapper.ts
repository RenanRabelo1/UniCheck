import type { Movimentacao } from '../../database/types.js'

export function toMovimentacaoView(movimentacao: Movimentacao, registradoPorNome: string | null) {
  return {
    id: movimentacao.id,
    type: movimentacao.tipo === 'RETIRADA' ? ('withdrawal' as const) : ('return' as const),
    requestId: movimentacao.solicitacaoId,
    itemId: movimentacao.itemId,
    itemName: movimentacao.itemNome,
    responsible: movimentacao.responsavel,
    registeredBy: registradoPorNome,
    registeredAt: movimentacao.registradoEm,
    notes: movimentacao.observacao ?? null,
  }
}

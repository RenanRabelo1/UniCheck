import type { Movimentacao, Usuario } from '../../database/types.js'

export function toMovimentacaoView(movimentacao: Movimentacao, usuarios: Usuario[]) {
  return {
    id: movimentacao.id,
    type: movimentacao.tipo === 'RETIRADA' ? ('withdrawal' as const) : ('return' as const),
    requestId: movimentacao.solicitacaoId,
    itemId: movimentacao.itemId,
    itemName: movimentacao.itemNome,
    responsible: movimentacao.responsavel,
    registeredBy: usuarios.find((usuario) => usuario.id === movimentacao.registradoPorId)?.nome ?? null,
    registeredAt: movimentacao.registradoEm,
    notes: movimentacao.observacao ?? null,
  }
}

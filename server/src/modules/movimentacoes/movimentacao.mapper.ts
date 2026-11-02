import { ROTULO_STATUS } from '../solicitacoes/solicitacao.status.js'
import type { ItemHistorico, RegistroMovimento } from './movimentacao.repository.js'
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

function toRegistroView(registro: RegistroMovimento | null) {
  return (
    registro && { at: registro.em, by: registro.por, responsible: registro.responsavel, notes: registro.observacao }
  )
}

export function toHistoricoView(item: ItemHistorico) {
  return {
    itemId: item.itemId,
    requestId: item.solicitacaoId,
    protocol: item.protocolo,
    requester: item.solicitanteNome,
    registration: item.matricula,
    itemName: item.itemNome,
    itemType: item.tipoItem === 'CHAVE' ? ('key' as const) : ('material' as const),
    room: item.sala,
    status: item.status,
    statusLabel: ROTULO_STATUS[item.status],
    decision: item.decididoEm
      ? {
          at: item.decididoEm,
          by: item.decididoPor,
          outcome: item.status === 'RECUSADO' ? ('refused' as const) : ('approved' as const),
          reason: item.motivoRecusa,
        }
      : null,
    withdrawal: toRegistroView(item.retirada),
    return: toRegistroView(item.devolucao),
    wasLate: item.teveAtraso,
  }
}

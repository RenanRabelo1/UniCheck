import type { Sala, Solicitacao } from '../../database/types.js'
import { ROTULO_STATUS } from './solicitacao.status.js'

export const roomLabel = (sala: Sala) => `${sala.codigo} · ${sala.nome}`

/** Formato que o front recebe para uma solicitação. */
export function toSolicitacaoView(solicitacao: Solicitacao, salas: Sala[]) {
  const sala = salas.find((item) => item.id === solicitacao.salaId)

  return {
    id: solicitacao.id,
    createdAt: solicitacao.criadoEm,
    date: solicitacao.dataUtilizacao,
    room: { value: solicitacao.salaId, label: sala ? roomLabel(sala) : solicitacao.salaId },
    pickupTime: solicitacao.retiradaPrevista,
    returnTime: solicitacao.devolucaoPrevista,
    notes: solicitacao.observacoes ?? null,
    items: solicitacao.itens.map((item) => ({
      id: item.id,
      type: item.tipo === 'CHAVE' ? ('key' as const) : ('material' as const),
      name: item.nome,
      detail: item.detalhe ?? null,
      quantity: item.quantidade,
      status: item.status,
      statusLabel: ROTULO_STATUS[item.status],
      refusalReason: item.motivoRecusa ?? null,
    })),
  }
}

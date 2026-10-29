import { withTransaction } from '../../database/sql.js'
import { currentTime, todayIso } from '../../utils/dates.js'
import { solicitacaoRepository } from '../solicitacoes/solicitacao.repository.js'
import { LIMITE_DEVOLUCAO } from '../solicitacoes/solicitacao.regras.js'
import { alertaRepository, type AlertaComSolicitante } from './alerta.repository.js'

function toAlertaView(alerta: AlertaComSolicitante) {
  return {
    id: alerta.id,
    requestId: alerta.solicitacaoId,
    itemId: alerta.itemId,
    itemName: alerta.itemNome,
    requester: alerta.solicitanteNome,
    createdAt: alerta.criadoEm,
    resolvedAt: alerta.resolvidoEm ?? null,
    status: alerta.resolvidoEm ? ('resolved' as const) : ('open' as const),
  }
}

export const alertaService = {
  /**
   * Procura itens que passaram do limite de devolução e ainda estão em posse.
   * É seguro chamar várias vezes: um item que já é ATRASADO não gera outro alerta.
   */
  async verificarAtrasos(now: Date = new Date()) {
    const hoje = todayIso(now)
    // Venceu se o dia da utilização já passou, ou se é hoje e já deu 22:40.
    const jaPassouDoLimite = currentTime(now) >= LIMITE_DEVOLUCAO

    const criados = await withTransaction(async (connection) => {
      const vencidos = await alertaRepository.listItensVencidosForUpdate(hoje, jaPassouDoLimite, connection)
      for (const { id } of vencidos) {
        // Sem `atualizadoEm`: o painel mostra "em posse desde" com o horário da retirada.
        await solicitacaoRepository.updateItem(id, { status: 'ATRASADO' }, connection)
        await alertaRepository.create(id, now, connection)
      }
      return vencidos.length
    })

    return { created: criados }
  },

  async list(filtro: 'open' | 'resolved' | 'all') {
    const resolvido = filtro === 'all' ? undefined : filtro === 'resolved'
    const alertas = await alertaRepository.list(resolvido)
    return alertas.map(toAlertaView)
  },
}

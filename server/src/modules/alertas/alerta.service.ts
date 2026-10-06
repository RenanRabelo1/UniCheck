import type { Alerta } from '../../database/types.js'
import { currentTime, todayIso } from '../../utils/dates.js'
import { LIMITE_DEVOLUCAO } from '../solicitacoes/solicitacao.regras.js'
import { newId } from '../../utils/ids.js'
import { usuarioRepository } from '../usuarios/usuario.repository.js'
import { alertaRepository } from './alerta.repository.js'

function toAlertaView(alerta: Alerta, nomeSolicitante: string | null) {
  return {
    id: alerta.id,
    requestId: alerta.solicitacaoId,
    itemId: alerta.itemId,
    itemName: alerta.itemNome,
    requester: nomeSolicitante,
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
    const agora = currentTime(now)

    const criados = await alertaRepository.transaction((database) => {
      const novos: Alerta[] = []

      for (const solicitacao of database.solicitacoes) {
        // Venceu se o dia da utilização já passou, ou se é hoje e já deu 22:40.
        const venceu =
          solicitacao.dataUtilizacao < hoje || (solicitacao.dataUtilizacao === hoje && agora >= LIMITE_DEVOLUCAO)
        if (!venceu) continue

        for (const item of solicitacao.itens) {
          if (item.status !== 'RETIRADO') continue

          // Não mexe em `atualizadoEm`: o painel mostra "em posse desde" com o horário da retirada.
          item.status = 'ATRASADO'
          const alerta: Alerta = {
            id: newId('alr'),
            solicitacaoId: solicitacao.id,
            itemId: item.id,
            itemNome: item.nome,
            usuarioId: solicitacao.usuarioId,
            criadoEm: now.toISOString(),
          }
          database.alertas.push(alerta)
          novos.push(alerta)
        }
      }

      return novos
    })

    return { created: criados.length }
  },

  async list(filtro: 'open' | 'resolved' | 'all') {
    const resolvido = filtro === 'all' ? undefined : filtro === 'resolved'
    const [alertas, usuarios] = await Promise.all([alertaRepository.list(resolvido), usuarioRepository.listAll()])
    return alertas.map((alerta) =>
      toAlertaView(alerta, usuarios.find((usuario) => usuario.id === alerta.usuarioId)?.nome ?? null),
    )
  },
}

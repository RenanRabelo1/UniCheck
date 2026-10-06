import type { StatusItem, Usuario } from '../../database/types.js'
import { solicitacaoRepository, type ItemDoUsuario } from '../solicitacoes/solicitacao.repository.js'
import { STATUS_APROVADOS, STATUS_EM_POSSE, STATUS_PENDENTES } from '../solicitacoes/solicitacao.status.js'
import { toUsuarioSessao } from '../usuarios/usuario.mapper.js'
import { formatWhen } from './dashboard.format.js'

const RECENT_ACTIVITY_LIMIT = 5

type Tone = 'approved' | 'active' | 'returned'

type Presentation = {
  tone: Tone
  label: string
  detail: (item: ItemDoUsuario, now: Date) => string
}

// PENDENTE e RECUSADO ficam fora da atividade recente: o front só tem
// estilos para approved/active/returned. Pendentes aparecem no resumo.
const presentation: Partial<Record<StatusItem, Presentation>> = {
  APROVADO: {
    tone: 'approved',
    label: 'Aprovada',
    detail: (item, now) => `Solicitado ${formatWhen(item.solicitadoEm, now)} · Retirada autorizada na secretaria`,
  },
  RESERVADO: {
    tone: 'approved',
    label: 'Reservada',
    detail: (item, now) => `Solicitado ${formatWhen(item.solicitadoEm, now)} · Reservado para retirada`,
  },
  RETIRADO: {
    tone: 'active',
    label: 'Em posse',
    detail: (item, now) =>
      `Em posse desde ${formatWhen(item.atualizadoEm, now)}${item.detalhe ? ` · ${item.detalhe}` : ''}`,
  },
  ATRASADO: {
    tone: 'active',
    label: 'Em atraso',
    detail: (item, now) =>
      `Devolução em atraso · em posse desde ${formatWhen(item.atualizadoEm, now)}${item.detalhe ? ` · ${item.detalhe}` : ''}`,
  },
  DEVOLVIDO: {
    tone: 'returned',
    label: 'Devolvida',
    detail: (item, now) => `Devolvido em ${formatWhen(item.atualizadoEm, now)} · Conferido pela equipe de suporte`,
  },
}

const countByStatus = (itens: ItemDoUsuario[], statuses: StatusItem[]) =>
  itens.filter((item) => statuses.includes(item.status)).length

export const dashboardService = {
  async getDashboard(usuario: Usuario, now: Date = new Date()) {
    const itens = await solicitacaoRepository.listItensByUsuario(usuario.id)

    const recentActivity = itens
      .filter((item) => presentation[item.status])
      .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
      .slice(0, RECENT_ACTIVITY_LIMIT)
      .map((item) => {
        const view = presentation[item.status]!
        return {
          id: item.id,
          icon: item.tipo === 'CHAVE' ? '◉' : '▣',
          title: item.quantidade > 1 ? `${item.nome} (${item.quantidade} un.)` : item.nome,
          detail: view.detail(item, now),
          status: view.label,
          tone: view.tone,
        }
      })

    return {
      user: toUsuarioSessao(usuario),
      summary: {
        pending: countByStatus(itens, STATUS_PENDENTES),
        approved: countByStatus(itens, STATUS_APROVADOS),
        inPossession: countByStatus(itens, STATUS_EM_POSSE),
      },
      recentActivity,
    }
  },
}

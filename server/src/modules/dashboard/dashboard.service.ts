import type { ItemSolicitacao, StatusItem, Usuario } from '../../database/types.js'
import { currentTime, todayIso } from '../../utils/dates.js'
import { alertaRepository } from '../alertas/alerta.repository.js'
import { solicitacaoRepository, type ItemDoUsuario } from '../solicitacoes/solicitacao.repository.js'
import { STATUS_APROVADOS, STATUS_EM_POSSE, STATUS_PENDENTES } from '../solicitacoes/solicitacao.status.js'
import { toRequester, toUsuarioSessao } from '../usuarios/usuario.mapper.js'
import { usuarioRepository } from '../usuarios/usuario.repository.js'
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

const somarStatus = (contagem: Map<StatusItem, number>, statuses: StatusItem[]) =>
  statuses.reduce((total, status) => total + (contagem.get(status) ?? 0), 0)

/** Resume os itens em uma situação: primeiro o que exige ação; finalizada quando nenhum item segue em aberto (RN24). */
function situacaoDaSolicitacao(itens: ItemSolicitacao[]): string {
  const tem = (...statuses: StatusItem[]) => itens.some((item) => statuses.includes(item.status))
  if (tem('ATRASADO')) return 'Em atraso'
  if (tem('RETIRADO')) return 'Em posse'
  if (tem('PENDENTE')) return 'Pendente'
  if (tem(...STATUS_APROVADOS)) return 'Aprovada'
  return itens.every((item) => item.status === 'RECUSADO') ? 'Recusada' : 'Finalizada'
}

const countByStatus = (itens: ItemDoUsuario[], statuses: StatusItem[]) =>
  itens.filter((item) => statuses.includes(item.status)).length

export const dashboardService = {
  /** Painel da Coordenação: contagens do fluxo e as solicitações mais recentes. */
  async getAdminDashboard(now: Date = new Date()) {
    const [contagem, pendingReturns, openAlerts, solicitacoes, usuarios] = await Promise.all([
      solicitacaoRepository.contarItensPorStatus(),
      solicitacaoRepository.contarDevolucoesVencidas(todayIso(now), currentTime(now)),
      alertaRepository.contarAbertos(),
      solicitacaoRepository.listAll(),
      usuarioRepository.listAll(),
    ])

    const recentRequests = [...solicitacoes]
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
      .slice(0, RECENT_ACTIVITY_LIMIT)
      .map((solicitacao) => {
        const solicitante = toRequester(usuarios.find((usuario) => usuario.id === solicitacao.usuarioId))
        return {
          id: solicitacao.id,
          protocol: solicitacao.protocolo,
          requester: solicitante?.name ?? null,
          requesterRole: solicitante?.roleLabel ?? null,
          items: solicitacao.itens.map((item) => item.nome),
          date: solicitacao.dataUtilizacao,
          pickupTime: solicitacao.retiradaPrevista,
          returnTime: solicitacao.devolucaoPrevista,
          statusLabel: situacaoDaSolicitacao(solicitacao.itens),
        }
      })

    return {
      summary: {
        pendingItems: somarStatus(contagem, STATUS_PENDENTES),
        approvedItems: somarStatus(contagem, STATUS_APROVADOS),
        withdrawnItems: somarStatus(contagem, STATUS_EM_POSSE),
        pendingReturns,
        openAlerts,
      },
      recentRequests,
    }
  },

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

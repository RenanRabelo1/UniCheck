import { withTransaction } from '../../database/sql.js'
import type { TipoMovimentacao, Usuario } from '../../database/types.js'
import { HttpError } from '../../middlewares/httpError.js'
import { todayIso } from '../../utils/dates.js'
import { alertaRepository } from '../alertas/alerta.repository.js'
import { solicitacaoRepository } from '../solicitacoes/solicitacao.repository.js'
import { usuarioRepository } from '../usuarios/usuario.repository.js'
import { toMovimentacaoView } from './movimentacao.mapper.js'
import { movimentacaoRepository } from './movimentacao.repository.js'
import type { DevolucaoInput, RetiradaInput } from './movimentacao.validation.js'

export const movimentacaoService = {
  async registrarRetirada(funcionario: Usuario, input: RetiradaInput, now: Date = new Date()) {
    const movimentacao = await withTransaction(async (connection) => {
      // Trava o item: duas retiradas simultâneas do mesmo item não passam juntas.
      const encontrado = await solicitacaoRepository.findItemForUpdate(input.requestId, input.itemId, connection)
      if (!encontrado) throw new HttpError(404, 'Item da solicitação não encontrado.')
      const { solicitacao, item } = encontrado

      if (item.status !== 'APROVADO' && item.status !== 'RESERVADO') {
        throw new HttpError(409, 'Só é possível retirar itens aprovados.')
      }
      if (solicitacao.dataUtilizacao !== todayIso(now)) {
        throw new HttpError(409, `A retirada só pode ser registrada no dia de utilização (${solicitacao.dataUtilizacao}).`)
      }

      await solicitacaoRepository.updateItem(item.id, { status: 'RETIRADO', atualizadoEm: now }, connection)
      await solicitacaoRepository.refreshStatusGeral(solicitacao.id, connection)
      return registrar('RETIRADA', encontrado, funcionario, input, now, connection)
    })

    return toMovimentacaoView(movimentacao, funcionario.nome)
  },

  async registrarDevolucao(funcionario: Usuario, input: DevolucaoInput, now: Date = new Date()) {
    const { movimentacao, atrasada } = await withTransaction(async (connection) => {
      const encontrado = await solicitacaoRepository.findItemForUpdate(input.requestId, input.itemId, connection)
      if (!encontrado) throw new HttpError(404, 'Item da solicitação não encontrado.')
      const { solicitacao, item } = encontrado

      if (item.status !== 'RETIRADO' && item.status !== 'ATRASADO') {
        throw new HttpError(409, 'Só é possível devolver itens que estão em posse.')
      }

      const atrasada = item.status === 'ATRASADO'
      await solicitacaoRepository.updateItem(item.id, { status: 'DEVOLVIDO', atualizadoEm: now }, connection)
      await solicitacaoRepository.refreshStatusGeral(solicitacao.id, connection)
      // Regra do docs: devolver resolve o alerta de atraso do item.
      await alertaRepository.resolverDoItem(item.id, now, connection)

      return { movimentacao: await registrar('DEVOLUCAO', encontrado, funcionario, input, now, connection), atrasada }
    })

    return { ...toMovimentacaoView(movimentacao, funcionario.nome), wasLate: atrasada }
  },

  async list(filtros: { requestId?: string; itemId?: string }) {
    const movimentacoes = await movimentacaoRepository.list(filtros)
    return movimentacoes.map((movimentacao) => toMovimentacaoView(movimentacao, movimentacao.registradoPorNome))
  },
}

async function registrar(
  tipo: TipoMovimentacao,
  { solicitacao, item }: NonNullable<Awaited<ReturnType<typeof solicitacaoRepository.findItemForUpdate>>>,
  funcionario: Usuario,
  dados: { responsibleName?: string; notes?: string },
  now: Date,
  connection: Parameters<typeof solicitacaoRepository.refreshStatusGeral>[1],
) {
  const solicitante = await usuarioRepository.findById(solicitacao.usuarioId)
  return movimentacaoRepository.create(
    {
      tipo,
      solicitacaoId: solicitacao.id,
      itemId: item.id,
      itemNome: item.nome,
      registradoPorId: funcionario.id,
      responsavel: dados.responsibleName || solicitante?.nome || 'Não informado',
      observacao: dados.notes || undefined,
      now,
    },
    connection,
  )
}

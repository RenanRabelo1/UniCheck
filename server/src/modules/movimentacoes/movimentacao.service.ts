import type { Database, ItemSolicitacao, Movimentacao, Solicitacao, TipoMovimentacao, Usuario } from '../../database/types.js'
import { HttpError } from '../../middlewares/httpError.js'
import { todayIso } from '../../utils/dates.js'
import { newId } from '../../utils/ids.js'
import { usuarioRepository } from '../usuarios/usuario.repository.js'
import { toMovimentacaoView } from './movimentacao.mapper.js'
import { movimentacaoRepository } from './movimentacao.repository.js'
import type { DevolucaoInput, RetiradaInput } from './movimentacao.validation.js'

function localizar(database: Database, requestId: string, itemId: string) {
  const solicitacao = database.solicitacoes.find((candidata) => candidata.id === requestId)
  const item = solicitacao?.itens.find((candidato) => candidato.id === itemId)
  if (!solicitacao || !item) throw new HttpError(404, 'Item da solicitação não encontrado.')
  return { solicitacao, item }
}

function registrar(
  database: Database,
  tipo: TipoMovimentacao,
  { solicitacao, item }: { solicitacao: Solicitacao; item: ItemSolicitacao },
  funcionario: Usuario,
  dados: { responsibleName?: string; notes?: string },
  now: Date,
): Movimentacao {
  const solicitante = database.usuarios.find((usuario) => usuario.id === solicitacao.usuarioId)
  const movimentacao: Movimentacao = {
    id: newId('mov'),
    tipo,
    solicitacaoId: solicitacao.id,
    itemId: item.id,
    itemNome: item.nome,
    registradoPorId: funcionario.id,
    responsavel: dados.responsibleName || solicitante?.nome || 'Não informado',
    registradoEm: now.toISOString(),
    observacao: dados.notes || undefined,
  }
  database.movimentacoes.push(movimentacao)
  return movimentacao
}

export const movimentacaoService = {
  async registrarRetirada(funcionario: Usuario, input: RetiradaInput, now: Date = new Date()) {
    const movimentacao = await movimentacaoRepository.transaction((database) => {
      const encontrado = localizar(database, input.requestId, input.itemId)
      const { solicitacao, item } = encontrado

      if (item.status !== 'APROVADO' && item.status !== 'RESERVADO') {
        throw new HttpError(409, 'Só é possível retirar itens aprovados.')
      }
      if (solicitacao.dataUtilizacao !== todayIso(now)) {
        throw new HttpError(409, `A retirada só pode ser registrada no dia de utilização (${solicitacao.dataUtilizacao}).`)
      }

      item.status = 'RETIRADO'
      item.atualizadoEm = now.toISOString()
      return registrar(database, 'RETIRADA', encontrado, funcionario, input, now)
    })

    return toMovimentacaoView(movimentacao, [funcionario])
  },

  async registrarDevolucao(funcionario: Usuario, input: DevolucaoInput, now: Date = new Date()) {
    const { movimentacao, atrasada } = await movimentacaoRepository.transaction((database) => {
      const encontrado = localizar(database, input.requestId, input.itemId)
      const { item } = encontrado

      if (item.status !== 'RETIRADO' && item.status !== 'ATRASADO') {
        throw new HttpError(409, 'Só é possível devolver itens que estão em posse.')
      }

      const atrasada = item.status === 'ATRASADO'
      item.status = 'DEVOLVIDO'
      item.atualizadoEm = now.toISOString()

      // Regra do docs: devolver resolve o alerta de atraso do item.
      for (const alerta of database.alertas) {
        if (alerta.itemId === item.id && !alerta.resolvidoEm) alerta.resolvidoEm = now.toISOString()
      }

      return { movimentacao: registrar(database, 'DEVOLUCAO', encontrado, funcionario, input, now), atrasada }
    })

    return { ...toMovimentacaoView(movimentacao, [funcionario]), wasLate: atrasada }
  },

  async list(filtros: { requestId?: string; itemId?: string }) {
    const [movimentacoes, usuarios] = await Promise.all([movimentacaoRepository.list(filtros), usuarioRepository.listAll()])
    return movimentacoes.map((movimentacao) => toMovimentacaoView(movimentacao, usuarios))
  },
}

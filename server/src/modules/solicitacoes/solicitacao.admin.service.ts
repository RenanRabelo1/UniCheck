import { withTransaction } from '../../database/sql.js'
import type { StatusItem, Usuario } from '../../database/types.js'
import { HttpError } from '../../middlewares/httpError.js'
import { chaveRepository } from '../chaves/chave.repository.js'
import { materialRepository } from '../materiais/material.repository.js'
import { toRequester } from '../usuarios/usuario.mapper.js'
import { usuarioRepository } from '../usuarios/usuario.repository.js'
import { quantidadeOcupada, travarItens } from './solicitacao.disponibilidade.js'
import { toSolicitacaoView } from './solicitacao.mapper.js'
import { solicitacaoRepository } from './solicitacao.repository.js'
import { ROTULO_STATUS } from './solicitacao.status.js'
import type { DecisionInput } from './solicitacao.validation.js'

export const solicitacaoAdminService = {
  /** Fila da Secretaria/Coordenação: todas as solicitações, com filtros opcionais. */
  async list(filtros: { status?: StatusItem; date?: string }) {
    const [solicitacoes, salas, usuarios] = await Promise.all([
      solicitacaoRepository.listAll(),
      chaveRepository.listSalas(),
      usuarioRepository.listAll(),
    ])

    return solicitacoes
      .filter((solicitacao) => !filtros.date || solicitacao.dataUtilizacao === filtros.date)
      .filter((solicitacao) => !filtros.status || solicitacao.itens.some((item) => item.status === filtros.status))
      .map((solicitacao) => ({
        ...toSolicitacaoView(solicitacao, salas),
        requester: toRequester(usuarios.find((usuario) => usuario.id === solicitacao.usuarioId)),
      }))
  },

  /** Aprova ou recusa UM item. A aprovação é o momento em que o item passa a "segurar" estoque. */
  async decide(
    coordenador: Usuario,
    solicitacaoId: string,
    itemId: string,
    input: DecisionInput,
    now: Date = new Date(),
  ) {
    const solicitacao = await withTransaction(async (connection) => {
      const existente = await solicitacaoRepository.findById(solicitacaoId, connection)
      if (!existente) throw new HttpError(404, 'Solicitação não encontrada.')
      if (!existente.itens.some((candidato) => candidato.id === itemId)) throw new HttpError(404, 'Item não encontrado.')

      // Trava o item e lê a situação de novo: uma decisão simultânea já pode ter acontecido.
      const encontrado = await solicitacaoRepository.findItemForUpdate(solicitacaoId, itemId, connection)
      const { solicitacao: cabecalho, item } = encontrado!

      if (item.status !== 'PENDENTE') {
        throw new HttpError(409, `Este item já foi analisado (situação atual: ${ROTULO_STATUS[item.status]}).`)
      }

      if (input.decision === 'approve') {
        // Quantas unidades existem: material = estoque cadastrado; chave = 1. Inativo não pode ser aprovado.
        const total =
          item.tipo === 'MATERIAL'
            ? (await materialRepository.findActiveById(item.referenciaId, connection))?.quantidadeTotal
            : (await chaveRepository.findActiveById(item.referenciaId, connection)) && 1
        if (total === undefined) throw new HttpError(409, `${item.nome} está inativo no cadastro.`)

        // Reconfere a disponibilidade AGORA: dois pedidos pendentes podem ter pedido o mesmo item.
        // Travar o cadastro do item faz o segundo aprovador esperar e enxergar o estoque já atualizado.
        await travarItens([item], connection)
        const janela = { data: cabecalho.dataUtilizacao, inicio: cabecalho.retiradaPrevista, fim: cabecalho.devolucaoPrevista }
        const livre = total - (await quantidadeOcupada(item.tipo, item.referenciaId, janela, connection))
        if (item.quantidade > livre) {
          throw new HttpError(409, `${item.nome} não tem unidades suficientes nesse horário (livres: ${Math.max(0, livre)}).`)
        }
        await solicitacaoRepository.updateItem(
          item.id,
          { status: 'APROVADO', atualizadoEm: now, decididoPorId: coordenador.id },
          connection,
        )
      } else {
        await solicitacaoRepository.updateItem(
          item.id,
          { status: 'RECUSADO', atualizadoEm: now, decididoPorId: coordenador.id, motivoRecusa: input.reason },
          connection,
        )
      }

      await solicitacaoRepository.refreshStatusGeral(cabecalho.id, connection)
      return (await solicitacaoRepository.findById(cabecalho.id, connection))!
    })

    const [salas, solicitante] = await Promise.all([chaveRepository.listSalas(), usuarioRepository.findById(solicitacao.usuarioId)])
    return { ...toSolicitacaoView(solicitacao, salas), requester: toRequester(solicitante) }
  },
}

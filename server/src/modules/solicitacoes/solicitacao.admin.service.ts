import type { StatusItem, Usuario } from '../../database/types.js'
import { HttpError } from '../../middlewares/httpError.js'
import { chaveRepository } from '../chaves/chave.repository.js'
import { materialRepository } from '../materiais/material.repository.js'
import { toRequester } from '../usuarios/usuario.mapper.js'
import { usuarioRepository } from '../usuarios/usuario.repository.js'
import { quantidadeOcupada } from './solicitacao.disponibilidade.js'
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
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
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
    const [materiais, chaves, salas] = await Promise.all([
      materialRepository.listActive(),
      chaveRepository.listActive(),
      chaveRepository.listSalas(),
    ])
    // Quantas unidades existem de cada coisa: material = estoque; chave = 1.
    const capacidade = new Map<string, number>([
      ...materiais.map((material) => [material.id, material.quantidadeTotal] as const),
      ...chaves.map((chave) => [chave.id, 1] as const),
    ])

    const solicitacao = await solicitacaoRepository.transaction((solicitacoes) => {
      const alvo = solicitacoes.find((item) => item.id === solicitacaoId)
      if (!alvo) throw new HttpError(404, 'Solicitação não encontrada.')
      const item = alvo.itens.find((candidato) => candidato.id === itemId)
      if (!item) throw new HttpError(404, 'Item não encontrado.')

      if (item.status !== 'PENDENTE') {
        throw new HttpError(409, `Este item já foi analisado (situação atual: ${ROTULO_STATUS[item.status]}).`)
      }

      if (input.decision === 'approve') {
        const total = capacidade.get(item.referenciaId)
        if (total === undefined) throw new HttpError(409, `${item.nome} está inativo no cadastro.`)

        // Reconfere a disponibilidade AGORA: dois pedidos pendentes podem ter pedido o mesmo item.
        const janela = { data: alvo.dataUtilizacao, inicio: alvo.retiradaPrevista, fim: alvo.devolucaoPrevista }
        const livre = total - quantidadeOcupada(solicitacoes, item.tipo, item.referenciaId, janela)
        if (item.quantidade > livre) {
          throw new HttpError(409, `${item.nome} não tem unidades suficientes nesse horário (livres: ${Math.max(0, livre)}).`)
        }
        item.status = 'APROVADO'
      } else {
        item.status = 'RECUSADO'
        item.motivoRecusa = input.reason
      }

      item.atualizadoEm = now.toISOString()
      item.decididoPorId = coordenador.id
      return alvo
    })

    const solicitante = await usuarioRepository.findById(solicitacao.usuarioId)
    return { ...toSolicitacaoView(solicitacao, salas), requester: toRequester(solicitante) }
  },
}

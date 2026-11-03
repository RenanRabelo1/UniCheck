import { withTransaction } from '../../database/sql.js'
import type { ItemSolicitacao, Movimentacao, Solicitacao, TipoMovimentacao, Usuario } from '../../database/types.js'
import { HttpError } from '../../middlewares/httpError.js'
import { alertaRepository } from '../alertas/alerta.repository.js'
import { ROTULO_TIPO_CHAVE } from '../chaves/chave.mapper.js'
import { chaveRepository } from '../chaves/chave.repository.js'
import { solicitacaoRepository } from '../solicitacoes/solicitacao.repository.js'
import { usuarioRepository } from '../usuarios/usuario.repository.js'
import { toHistoricoView, toMovimentacaoView } from './movimentacao.mapper.js'
import { movimentacaoRepository, type FiltrosHistorico } from './movimentacao.repository.js'
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
      // A retirada pode ser registrada em qualquer data: a data da solicitação é só a previsão,
      // e o horário real fica salvo na movimentação.

      const chaveEntregue = item.tipo === 'CHAVE' ? await resolverChaveEntregue(solicitacao, item, input.keyId, connection) : undefined

      await solicitacaoRepository.updateItem(item.id, { status: 'RETIRADO', atualizadoEm: now, chaveEntregue }, connection)
      await solicitacaoRepository.refreshStatusGeral(solicitacao.id, connection)
      const atualizado = { solicitacao, item: { ...item, nome: chaveEntregue?.nome ?? item.nome } }
      return registrar('RETIRADA', atualizado, funcionario, input, now, connection)
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
      await solicitacaoRepository.updateItem(
        item.id,
        { status: 'DEVOLVIDO', atualizadoEm: now, condicaoDevolucao: input.condition },
        connection,
      )
      await solicitacaoRepository.refreshStatusGeral(solicitacao.id, connection)
      // Regra do docs: devolver resolve o alerta de atraso do item.
      await alertaRepository.resolverDoItem(item.id, now, connection)

      return { movimentacao: await registrar('DEVOLUCAO', encontrado, funcionario, input, now, connection), atrasada }
    })

    return { ...toMovimentacaoView(movimentacao, funcionario.nome), wasLate: atrasada }
  },

  async historico(filtros: FiltrosHistorico) {
    const itens = await movimentacaoRepository.listHistorico(filtros)
    return itens.map(toHistoricoView)
  },

  async list(filtros: { requestId?: string; itemId?: string }) {
    const movimentacoes = await movimentacaoRepository.list(filtros)
    return movimentacoes.map((movimentacao) => toMovimentacaoView(movimentacao, movimentacao.registradoPorNome))
  },
}

/** A chave física entregue precisa ser uma chave ativa da mesma sala da que foi pedida (RF17). */
async function resolverChaveEntregue(
  solicitacao: Omit<Solicitacao, 'itens'>,
  item: ItemSolicitacao,
  keyId: string | undefined,
  connection: Parameters<typeof solicitacaoRepository.refreshStatusGeral>[1],
) {
  if (!keyId) throw new HttpError(400, 'Selecione a chave entregue.')

  const pedida = await chaveRepository.findChave(item.referenciaId, connection)
  const entregue = await chaveRepository.findActiveById(keyId, connection)
  const sala = entregue && (await chaveRepository.findSala(entregue.salaId, connection))
  if (!entregue || !sala || entregue.salaId !== pedida?.salaId) {
    throw new HttpError(400, 'Chave não encontrada para esta sala.')
  }

  // O trigger do banco confere a autorização quando a chave do item muda.
  if (entregue.id !== pedida.id) {
    const solicitante = await usuarioRepository.findById(solicitacao.usuarioId)
    if (solicitante?.perfil === 'ALUNO' && !solicitante.autorizado) {
      throw new HttpError(409, 'O aluno não tem mais autorização ativa para trocar a chave. Entregue a chave pedida.')
    }
  }

  return { id: entregue.id, tipo: entregue.tipo, nome: `Chave ${sala.codigo} · ${ROTULO_TIPO_CHAVE[entregue.tipo]}` }
}

async function registrar(
  tipo: TipoMovimentacao,
  { solicitacao, item }: NonNullable<Awaited<ReturnType<typeof solicitacaoRepository.findItemForUpdate>>>,
  funcionario: Usuario,
  dados: { responsibleName?: string; notes?: string; condition?: Movimentacao['condicao'] },
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
      condicao: dados.condition,
      now,
    },
    connection,
  )
}

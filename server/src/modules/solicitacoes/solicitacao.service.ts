import { withTransaction } from '../../database/sql.js'
import type { ItemSolicitacao, Sala, TipoChave, TipoItem, Usuario } from '../../database/types.js'
import { HttpError } from '../../middlewares/httpError.js'
import { todayIso } from '../../utils/dates.js'
import { chaveRepository } from '../chaves/chave.repository.js'
import { materialRepository } from '../materiais/material.repository.js'
import { toRequester } from '../usuarios/usuario.mapper.js'
import { usuarioRepository } from '../usuarios/usuario.repository.js'
import { ocupacaoNaJanela, quantidadeOcupada, travarItens, type Janela } from './solicitacao.disponibilidade.js'
import { roomLabel, toSolicitacaoView } from './solicitacao.mapper.js'
import { LIMITE_DEVOLUCAO, SECRETARIA_ABRE, SECRETARIA_FECHA } from './solicitacao.regras.js'
import { solicitacaoRepository } from './solicitacao.repository.js'
import type { CreateSolicitacaoInput } from './solicitacao.validation.js'

const ROTULO_CHAVE: Record<TipoChave, string> = { PRIMARIA: 'Primária', SECUNDARIA: 'Secundária' }
const TIPO_DA_API: Record<'material' | 'key', TipoItem> = { material: 'MATERIAL', key: 'CHAVE' }
const MSG_SEM_AUTORIZACAO = 'Aluno sem autorização ativa para solicitar chaves.'

// Item já conferido, pronto para virar ItemSolicitacao. `capacidade` é quantas
// unidades existem no total (material: estoque; chave: sempre 1).
type ItemResolvido = Pick<ItemSolicitacao, 'tipo' | 'referenciaId' | 'nome' | 'detalhe' | 'quantidade'> & {
  capacidade: number
}

/** Só professores e alunos fazem solicitações. */
function validarPerfil(usuario: Usuario) {
  if (usuario.perfil !== 'PROFESSOR' && usuario.perfil !== 'ALUNO') {
    throw new HttpError(403, 'Seu perfil não pode criar solicitações.')
  }
}

/**
 * Todos escolhem da mesma lista de materiais e chaves. A única restrição é a chave:
 * o aluno só pode pedi-la com autorização ativa (o banco também confere isso por trigger).
 */
function podePedirChave(usuario: Usuario): boolean {
  return usuario.perfil === 'PROFESSOR' || usuario.autorizado
}

function validarPeriodo({ date, pickupTime, returnTime }: CreateSolicitacaoInput, now: Date) {
  if (date < todayIso(now)) {
    throw new HttpError(400, 'A data de utilização não pode estar no passado.')
  }
  if (pickupTime < SECRETARIA_ABRE || pickupTime > SECRETARIA_FECHA) {
    throw new HttpError(400, `A retirada deve ocorrer entre ${SECRETARIA_ABRE} e ${SECRETARIA_FECHA}.`)
  }
  if (returnTime <= pickupTime) {
    throw new HttpError(400, 'O horário previsto de devolução deve ser posterior ao horário de retirada.')
  }
  if (returnTime > LIMITE_DEVOLUCAO) {
    throw new HttpError(400, `A devolução institucional deve ocorrer até ${LIMITE_DEVOLUCAO}.`)
  }
}

async function resolverItem(
  usuario: Usuario,
  { type, id, quantity }: CreateSolicitacaoInput['items'][number],
  sala: Sala,
): Promise<ItemResolvido> {
  const tipo = TIPO_DA_API[type]

  if (tipo === 'MATERIAL') {
    const material = await materialRepository.findActiveById(id)
    if (!material) throw new HttpError(400, 'Material não encontrado.')
    return {
      tipo,
      referenciaId: material.id,
      nome: material.nome,
      detalhe: material.detalhe,
      quantidade: quantity,
      capacidade: material.quantidadeTotal,
    }
  }

  if (!podePedirChave(usuario)) throw new HttpError(403, MSG_SEM_AUTORIZACAO)

  const chave = await chaveRepository.findActiveById(id)
  if (!chave || chave.salaId !== sala.id) {
    throw new HttpError(400, 'Chave não encontrada para a sala escolhida.')
  }
  if (quantity !== 1) {
    throw new HttpError(400, 'Cada chave é solicitada uma única vez.')
  }
  return {
    tipo,
    referenciaId: chave.id,
    nome: `Chave ${sala.codigo} · ${ROTULO_CHAVE[chave.tipo]}`,
    detalhe: sala.nome,
    quantidade: 1,
    capacidade: 1,
  }
}

export const solicitacaoService = {
  /**
   * Tudo que o formulário "Nova solicitação" precisa: as salas e UMA lista de itens
   * (materiais e chaves) para o usuário clicar. Com uma janela (data e horários),
   * cada item vem com quantas unidades estão livres naquele horário.
   */
  async getOptions(usuario: Usuario, janela?: Janela) {
    validarPerfil(usuario)

    const [salas, materiais, chaves, ocupadoMateriais, ocupadoChaves] = await Promise.all([
      chaveRepository.listSalasAtivas(),
      materialRepository.listActive(),
      chaveRepository.listActive(),
      janela ? ocupacaoNaJanela('MATERIAL', janela) : new Map<string, number>(),
      janela ? ocupacaoNaJanela('CHAVE', janela) : new Map<string, number>(),
    ])
    const livre = (capacidade: number, ocupado: number | undefined) => Math.max(0, capacidade - (ocupado ?? 0))
    const chaveLiberada = podePedirChave(usuario)

    const itens = [
      ...materiais.map((material) => ({
        type: 'material' as const,
        id: material.id,
        name: material.nome,
        detail: material.detalhe ?? null,
        roomId: null as string | null,
        total: material.quantidadeTotal,
        available: livre(material.quantidadeTotal, ocupadoMateriais.get(material.id)),
        locked: false,
        lockedReason: null as string | null,
      })),
      ...chaves.flatMap((chave) => {
        const sala = salas.find((item) => item.id === chave.salaId)
        if (!sala) return []
        return [
          {
            type: 'key' as const,
            id: chave.id,
            name: `Chave ${sala.codigo} · ${ROTULO_CHAVE[chave.tipo]}`,
            detail: sala.nome,
            roomId: sala.id as string | null,
            total: 1,
            available: livre(1, ocupadoChaves.get(chave.id)),
            locked: !chaveLiberada,
            lockedReason: chaveLiberada ? null : 'Requer autorização ativa para solicitar chaves.',
          },
        ]
      }),
    ]

    const autorizacao = usuario.autorizacao
    const responsavel = autorizacao ? await usuarioRepository.findById(autorizacao.professorResponsavelId) : undefined
    return {
      rooms: salas.map((sala) => ({ value: sala.id, label: roomLabel(sala) })),
      items: itens,
      authorization: autorizacao
        ? { project: autorizacao.projeto, responsibleProfessor: responsavel?.nome ?? null }
        : null,
    }
  },

  async create(usuario: Usuario, input: CreateSolicitacaoInput, now: Date = new Date()) {
    validarPerfil(usuario)
    validarPeriodo(input, now)

    const sala = await chaveRepository.findActiveSala(input.room)
    if (!sala) throw new HttpError(400, 'Sala não encontrada.')

    const chaves = input.items.map((item) => `${item.type}:${item.id}`)
    if (new Set(chaves).size !== chaves.length) {
      throw new HttpError(400, 'Há itens repetidos na solicitação.')
    }
    const itens = await Promise.all(input.items.map((item) => resolverItem(usuario, item, sala)))

    const janela: Janela = { data: input.date, inicio: input.pickupTime, fim: input.returnTime }

    const criada = await withTransaction(async (connection) => {
      // Trava os itens pedidos: a checagem de disponibilidade e a gravação acontecem juntas,
      // sem brecha para outro pedido reservar o mesmo item no meio.
      await travarItens(itens, connection)
      for (const item of itens) {
        const livre = item.capacidade - (await quantidadeOcupada(item.tipo, item.referenciaId, janela, connection))
        if (item.quantidade > livre) {
          throw new HttpError(
            409,
            livre > 0
              ? `${item.nome}: só há ${livre} disponível(is) nesse horário.`
              : `${item.nome} não está disponível nesse horário.`,
          )
        }
      }

      return solicitacaoRepository.create(
        {
          usuarioId: usuario.id,
          sala,
          dataUtilizacao: input.date,
          retiradaPrevista: input.pickupTime,
          devolucaoPrevista: input.returnTime,
          observacoes: input.notes || undefined,
          now,
          itens: itens.map(({ capacidade: _capacidade, ...item }) => item),
        },
        connection,
      )
    })

    return toSolicitacaoView(criada, await chaveRepository.listSalas())
  },

  async list(usuario: Usuario) {
    const [solicitacoes, salas] = await Promise.all([solicitacaoRepository.listByUsuario(usuario.id), chaveRepository.listSalas()])
    return solicitacoes.map((solicitacao) => toSolicitacaoView(solicitacao, salas))
  },

  async getById(usuario: Usuario, id: string) {
    const detail = await solicitacaoRepository.detailsByUsuario(id, usuario.id)
    // Mesmo erro para "não existe" e "é de outra pessoa": não revela a existência.
    if (!detail) throw new HttpError(404, 'Solicitação não encontrada.')
    return {
      ...toSolicitacaoView(detail.solicitacao, detail.salas),
      requester: toRequester(usuario),
      movements: detail.movements,
    }
  },
}

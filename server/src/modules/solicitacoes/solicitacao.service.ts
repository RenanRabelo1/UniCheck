import type { ItemSolicitacao, Sala, TipoChave, TipoItem, Usuario } from '../../database/types.js'
import { HttpError } from '../../middlewares/httpError.js'
import { todayIso } from '../../utils/dates.js'
import { chaveRepository } from '../chaves/chave.repository.js'
import { materialRepository } from '../materiais/material.repository.js'
import { usuarioRepository } from '../usuarios/usuario.repository.js'
import { quantidadeOcupada, type Janela } from './solicitacao.disponibilidade.js'
import { roomLabel, toSolicitacaoView } from './solicitacao.mapper.js'
import { newId } from '../../utils/ids.js'
import { solicitacaoRepository } from './solicitacao.repository.js'
import { LIMITE_DEVOLUCAO, SECRETARIA_ABRE, SECRETARIA_FECHA } from './solicitacao.regras.js'
import type { CreateSolicitacaoInput } from './solicitacao.validation.js'

const ROTULO_CHAVE: Record<TipoChave, string> = { PRIMARIA: 'Primária', SECUNDARIA: 'Secundária' }

// Item já conferido, pronto para virar ItemSolicitacao. `capacidade` é quantas
// unidades existem no total (material: estoque; chave: sempre 1).
type ItemResolvido = Pick<ItemSolicitacao, 'tipo' | 'referenciaId' | 'nome' | 'detalhe' | 'quantidade'> & {
  capacidade: number
}

/** Regra do docs: professor só pede material; aluno autorizado só pede chave. */
function tipoPermitido(usuario: Usuario): TipoItem {
  if (usuario.perfil === 'PROFESSOR') return 'MATERIAL'

  if (usuario.perfil === 'ALUNO') {
    if (!usuario.autorizado || !usuario.autorizacao) {
      throw new HttpError(403, 'Aluno sem autorização ativa para solicitar chaves.')
    }
    return 'CHAVE'
  }

  throw new HttpError(403, 'Seu perfil não pode criar solicitações.')
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
  tipo: TipoItem,
  { id, quantity }: CreateSolicitacaoInput['items'][number],
  sala: Sala,
): Promise<ItemResolvido> {
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
  /** Dados que preenchem os campos do formulário "Nova solicitação". */
  async getOptions(usuario: Usuario, janela?: Janela) {
    const tipo = tipoPermitido(usuario)
    const [salas, solicitacoes] = await Promise.all([chaveRepository.listSalasAtivas(), solicitacaoRepository.listAll()])
    const rooms = salas.map((sala) => ({ value: sala.id, label: roomLabel(sala) }))
    const livre = (capacidade: number, referenciaId: string) =>
      janela ? Math.max(0, capacidade - quantidadeOcupada(solicitacoes, tipo, referenciaId, janela)) : capacidade

    if (tipo === 'MATERIAL') {
      const materiais = await materialRepository.listActive()
      return {
        rooms,
        materials: materiais.map((material) => ({
          value: material.id,
          label: material.detalhe ? `${material.nome} · ${material.detalhe}` : material.nome,
          available: livre(material.quantidadeTotal, material.id),
        })),
      }
    }

    const chaves = await chaveRepository.listActive()
    const keysByRoom: Record<string, { value: string; label: string; available: number }[]> = {}
    for (const chave of chaves) {
      const sala = salas.find((item) => item.id === chave.salaId)
      if (!sala) continue
      keysByRoom[sala.id] ??= []
      keysByRoom[sala.id].push({
        value: chave.id,
        label: `Chave ${sala.codigo} · ${ROTULO_CHAVE[chave.tipo]}`,
        available: livre(1, chave.id),
      })
    }

    // O tipoPermitido já garantiu que existe autorização.
    const autorizacao = usuario.autorizacao!
    const responsavel = await usuarioRepository.findById(autorizacao.professorResponsavelId)
    return {
      rooms,
      keysByRoom,
      authorization: { project: autorizacao.projeto, responsibleProfessor: responsavel?.nome ?? null },
    }
  },

  async create(usuario: Usuario, input: CreateSolicitacaoInput, now: Date = new Date()) {
    const tipo = tipoPermitido(usuario)
    validarPeriodo(input, now)

    const sala = await chaveRepository.findActiveSala(input.room)
    if (!sala) throw new HttpError(400, 'Sala não encontrada.')

    const ids = input.items.map((item) => item.id)
    if (new Set(ids).size !== ids.length) {
      throw new HttpError(400, 'Há itens repetidos na solicitação.')
    }
    const itens = await Promise.all(input.items.map((item) => resolverItem(tipo, item, sala)))

    const janela: Janela = { data: input.date, inicio: input.pickupTime, fim: input.returnTime }

    const criada = await solicitacaoRepository.create((existentes) => {
      // Checagem e gravação na mesma "transação": ninguém reserva o mesmo item no meio.
      for (const item of itens) {
        const livre = item.capacidade - quantidadeOcupada(existentes, item.tipo, item.referenciaId, janela)
        if (item.quantidade > livre) {
          throw new HttpError(
            409,
            livre > 0
              ? `${item.nome}: só há ${livre} disponível(is) nesse horário.`
              : `${item.nome} não está disponível nesse horário.`,
          )
        }
      }

      const agora = now.toISOString()
      return {
        id: newId('sol'),
        usuarioId: usuario.id,
        criadoEm: agora,
        salaId: sala.id,
        dataUtilizacao: input.date,
        retiradaPrevista: input.pickupTime,
        devolucaoPrevista: input.returnTime,
        observacoes: input.notes || undefined,
        itens: itens.map(({ capacidade: _capacidade, ...item }) => ({
          ...item,
          id: newId('item'),
          status: 'PENDENTE' as const,
          atualizadoEm: agora,
        })),
      }
    })

    return toSolicitacaoView(criada, await chaveRepository.listSalas())
  },

  async list(usuario: Usuario) {
    const [solicitacoes, salas] = await Promise.all([
      solicitacaoRepository.listByUsuario(usuario.id),
      chaveRepository.listSalas(),
    ])
    return solicitacoes.map((solicitacao) => toSolicitacaoView(solicitacao, salas))
  },

  async getById(usuario: Usuario, id: string) {
    const solicitacao = await solicitacaoRepository.findByIdAndUsuario(id, usuario.id)
    // Mesmo erro para "não existe" e "é de outra pessoa": não revela a existência.
    if (!solicitacao) throw new HttpError(404, 'Solicitação não encontrada.')
    return toSolicitacaoView(solicitacao, await chaveRepository.listSalas())
  },
}

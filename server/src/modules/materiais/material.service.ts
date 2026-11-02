import { withTransaction } from '../../database/sql.js'
import { HttpError } from '../../middlewares/httpError.js'
import { todayIso } from '../../utils/dates.js'
import {
  comprometidoPorMaterial,
  emPossePorMaterial,
  quantidadeComprometida,
  temItemEmAndamento,
} from '../solicitacoes/solicitacao.disponibilidade.js'
import { toMaterialView } from './material.mapper.js'
import { materialRepository } from './material.repository.js'
import type { CreateMaterialInput, UpdateMaterialInput } from './material.validation.js'

// Cadastros conferem "já existe?" antes de gravar; a trava faz dois cadastros simultâneos esperarem um pelo outro.
const TRAVA_CADASTRO = 'unicheck:cadastro-material'

export const materialService = {
  async list(filtro: { active?: 'true' | 'false' }, now: Date = new Date()) {
    const [materiais, comprometidos, emPosse] = await Promise.all([
      materialRepository.listAll(),
      comprometidoPorMaterial(todayIso(now)),
      emPossePorMaterial(),
    ])

    return materiais
      .filter((material) => filtro.active === undefined || material.ativo === (filtro.active === 'true'))
      .map((material) => toMaterialView(material, comprometidos.get(material.id) ?? 0, emPosse.get(material.id) ?? 0))
  },

  async create(input: CreateMaterialInput) {
    const detalhe = input.detail || undefined
    const patrimonio = input.patrimony || undefined

    const material = await withTransaction(async (connection) => {
      if (patrimonio && (await materialRepository.patrimonioExists(patrimonio, undefined, connection))) {
        throw new HttpError(409, 'Já existe um material com este patrimônio.')
      }
      if (await materialRepository.sameExists(input.name, detalhe, patrimonio, undefined, connection)) {
        throw new HttpError(409, 'Já existe um material com este nome e detalhe.')
      }
      return materialRepository.create(
        {
          nome: input.name,
          categoria: input.category,
          controle: input.control === 'individual' ? 'INDIVIDUAL' : 'QUANTIDADE',
          patrimonio,
          detalhe,
          quantidadeTotal: input.totalQuantity,
        },
        connection,
      )
    }, TRAVA_CADASTRO)

    return toMaterialView(material, 0)
  },

  async update(id: string, input: UpdateMaterialInput, now: Date = new Date()) {
    return withTransaction(async (connection) => {
      const material = await materialRepository.findById(id, connection)
      if (!material) throw new HttpError(404, 'Material não encontrado.')

      const nome = input.name ?? material.nome
      const detalhe = input.detail === undefined ? material.detalhe : input.detail || undefined
      const patrimonio = input.patrimony === undefined ? material.patrimonio : input.patrimony || undefined

      // O controle não muda depois do cadastro: mudar reinterpretaria o histórico do material.
      if (material.controle === 'INDIVIDUAL') {
        if (!patrimonio) throw new HttpError(400, 'Informe o patrimônio do material individual.')
        if (input.totalQuantity !== undefined && input.totalQuantity !== 1) {
          throw new HttpError(400, 'Material individual tem uma única unidade.')
        }
      } else if (patrimonio) {
        throw new HttpError(400, 'Material por quantidade não tem patrimônio.')
      }
      if (patrimonio && (await materialRepository.patrimonioExists(patrimonio, id, connection))) {
        throw new HttpError(409, 'Já existe um material com este patrimônio.')
      }

      if (await materialRepository.sameExists(nome, detalhe, patrimonio, id, connection)) {
        throw new HttpError(409, 'Já existe um material com este nome e detalhe.')
      }

      // Não dá para ter menos unidades do que as já aprovadas ou em posse.
      const comprometida = await quantidadeComprometida('MATERIAL', id, todayIso(now), connection)
      if (input.totalQuantity !== undefined && input.totalQuantity < comprometida) {
        throw new HttpError(409, `A quantidade total não pode ser menor que a já comprometida (${comprometida}).`)
      }

      // Regra do docs: inativa, nunca remove. E só quando nada está em andamento.
      if (input.active === false && material.ativo && (await temItemEmAndamento('MATERIAL', id, connection))) {
        throw new HttpError(409, 'Este material tem itens aprovados ou em posse. Aguarde a devolução para inativar.')
      }

      const atualizado = {
        nome,
        categoria: input.category ?? material.categoria,
        patrimonio,
        detalhe,
        quantidadeTotal: input.totalQuantity ?? material.quantidadeTotal,
        ativo: input.active ?? material.ativo,
      }
      await materialRepository.update(id, atualizado, connection)
      const emPosse = await emPossePorMaterial(connection)
      return toMaterialView({ id, controle: material.controle, ...atualizado }, comprometida, emPosse.get(id) ?? 0)
    }, TRAVA_CADASTRO)
  },
}

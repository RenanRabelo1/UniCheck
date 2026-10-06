import type { Material } from '../../database/types.js'
import { HttpError } from '../../middlewares/httpError.js'
import { newId } from '../../utils/ids.js'
import { todayIso } from '../../utils/dates.js'
import { quantidadeComprometida, temItemEmAndamento } from '../solicitacoes/solicitacao.disponibilidade.js'
import { solicitacaoRepository } from '../solicitacoes/solicitacao.repository.js'
import { toMaterialView } from './material.mapper.js'
import { materialRepository } from './material.repository.js'
import type { CreateMaterialInput, UpdateMaterialInput } from './material.validation.js'

const normalizar = (texto: string | undefined) => (texto ?? '').trim().toLowerCase()

// Dois materiais são "o mesmo" quando têm o mesmo nome e o mesmo detalhe (ex.: patrimônio).
const mesmoMaterial = (material: Material, nome: string, detalhe: string | undefined) =>
  normalizar(material.nome) === normalizar(nome) && normalizar(material.detalhe) === normalizar(detalhe)

export const materialService = {
  async list(filtro: { active?: 'true' | 'false' }, now: Date = new Date()) {
    const [materiais, solicitacoes] = await Promise.all([materialRepository.listAll(), solicitacaoRepository.listAll()])
    const hoje = todayIso(now)

    return materiais
      .filter((material) => filtro.active === undefined || material.ativo === (filtro.active === 'true'))
      .map((material) => toMaterialView(material, quantidadeComprometida(solicitacoes, 'MATERIAL', material.id, hoje)))
  },

  async create(input: CreateMaterialInput) {
    const detalhe = input.detail || undefined

    const material = await materialRepository.transaction((database) => {
      if (database.materiais.some((existente) => mesmoMaterial(existente, input.name, detalhe))) {
        throw new HttpError(409, 'Já existe um material com este nome e detalhe.')
      }

      const novo: Material = {
        id: newId('mat'),
        nome: input.name,
        detalhe,
        quantidadeTotal: input.totalQuantity,
        ativo: true,
      }
      database.materiais.push(novo)
      return novo
    })

    return toMaterialView(material, 0)
  },

  async update(id: string, input: UpdateMaterialInput, now: Date = new Date()) {
    const { material, comprometida } = await materialRepository.transaction((database) => {
      const material = database.materiais.find((candidato) => candidato.id === id)
      if (!material) throw new HttpError(404, 'Material não encontrado.')

      const nome = input.name ?? material.nome
      const detalhe = input.detail === undefined ? material.detalhe : input.detail || undefined

      if (database.materiais.some((outro) => outro.id !== id && mesmoMaterial(outro, nome, detalhe))) {
        throw new HttpError(409, 'Já existe um material com este nome e detalhe.')
      }

      // Não dá para ter menos unidades do que as já aprovadas ou em posse.
      const comprometida = quantidadeComprometida(database.solicitacoes, 'MATERIAL', id, todayIso(now))
      if (input.totalQuantity !== undefined && input.totalQuantity < comprometida) {
        throw new HttpError(409, `A quantidade total não pode ser menor que a já comprometida (${comprometida}).`)
      }

      // Regra do docs: inativa, nunca remove. E só quando nada está em andamento.
      if (input.active === false && material.ativo && temItemEmAndamento(database.solicitacoes, 'MATERIAL', id)) {
        throw new HttpError(409, 'Este material tem itens aprovados ou em posse. Aguarde a devolução para inativar.')
      }

      material.nome = nome
      material.detalhe = detalhe
      if (input.totalQuantity !== undefined) material.quantidadeTotal = input.totalQuantity
      if (input.active !== undefined) material.ativo = input.active

      return { material, comprometida }
    })

    return toMaterialView(material, comprometida)
  },
}

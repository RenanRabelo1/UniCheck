import type { Chave, Sala, TipoChave } from '../../database/types.js'
import { HttpError } from '../../middlewares/httpError.js'
import { newId } from '../../utils/ids.js'
import { STATUS_QUE_OCUPAM } from '../solicitacoes/solicitacao.status.js'
import { temItemEmAndamento } from '../solicitacoes/solicitacao.disponibilidade.js'
import { ROTULO_TIPO_CHAVE, toChaveView, toSalaView } from './chave.mapper.js'
import { chaveRepository } from './chave.repository.js'
import type { CreateChaveInput, CreateSalaInput, UpdateChaveInput, UpdateSalaInput } from './chave.validation.js'

const TIPO_DA_API: Record<CreateChaveInput['type'], TipoChave> = { primary: 'PRIMARIA', secondary: 'SECUNDARIA' }

export const salaService = {
  async list() {
    const salas = await chaveRepository.listSalas()
    return salas.map(toSalaView)
  },

  async create(input: CreateSalaInput) {
    const codigo = input.code.toUpperCase()

    const sala = await chaveRepository.transaction((database) => {
      // O id é o código em minúsculas (ex.: "j-205"), o mesmo valor que o front usa na lista de salas.
      const id = codigo.toLowerCase()
      if (database.salas.some((existente) => existente.id === id || existente.codigo.toUpperCase() === codigo)) {
        throw new HttpError(409, `Já existe uma sala com o código ${codigo}.`)
      }

      const nova: Sala = { id, codigo, nome: input.name, ativo: true }
      database.salas.push(nova)
      return nova
    })

    return toSalaView(sala)
  },

  async update(id: string, input: UpdateSalaInput) {
    const sala = await chaveRepository.transaction((database) => {
      const sala = database.salas.find((candidata) => candidata.id === id)
      if (!sala) throw new HttpError(404, 'Sala não encontrada.')

      const codigo = input.code?.toUpperCase() ?? sala.codigo
      if (database.salas.some((outra) => outra.id !== id && outra.codigo.toUpperCase() === codigo)) {
        throw new HttpError(409, `Já existe uma sala com o código ${codigo}.`)
      }

      if (input.active === false && sala.ativo) {
        const emUso = database.solicitacoes.some(
          (solicitacao) =>
            solicitacao.salaId === id && solicitacao.itens.some((item) => STATUS_QUE_OCUPAM.includes(item.status)),
        )
        if (emUso) {
          throw new HttpError(409, 'Esta sala tem itens aprovados ou em posse. Aguarde a devolução para inativar.')
        }
      }

      sala.codigo = codigo
      if (input.name !== undefined) sala.nome = input.name
      if (input.active !== undefined) sala.ativo = input.active
      return sala
    })

    return toSalaView(sala)
  },
}

export const chaveService = {
  async list() {
    const [chaves, salas] = await Promise.all([chaveRepository.listAll(), chaveRepository.listSalas()])
    return chaves.map((chave) => toChaveView(chave, salas))
  },

  async create(input: CreateChaveInput) {
    const tipo = TIPO_DA_API[input.type]

    const { chave, salas } = await chaveRepository.transaction((database) => {
      const sala = database.salas.find((candidata) => candidata.id === input.roomId && candidata.ativo)
      if (!sala) throw new HttpError(400, 'Sala não encontrada.')

      // Uma sala tem no máximo uma chave de cada tipo (primária e secundária).
      if (database.chaves.some((existente) => existente.salaId === sala.id && existente.tipo === tipo)) {
        throw new HttpError(
          409,
          `A sala ${sala.codigo} já tem uma chave ${ROTULO_TIPO_CHAVE[tipo].toLowerCase()}. Se estiver inativa, reative-a.`,
        )
      }

      const nova: Chave = { id: newId('chv'), salaId: sala.id, tipo, ativo: true }
      database.chaves.push(nova)
      return { chave: nova, salas: database.salas }
    })

    return toChaveView(chave, salas)
  },

  async update(id: string, input: UpdateChaveInput) {
    const { chave, salas } = await chaveRepository.transaction((database) => {
      const chave = database.chaves.find((candidata) => candidata.id === id)
      if (!chave) throw new HttpError(404, 'Chave não encontrada.')

      if (input.active === false && chave.ativo && temItemEmAndamento(database.solicitacoes, 'CHAVE', id)) {
        throw new HttpError(409, 'Esta chave está aprovada ou em posse. Aguarde a devolução para inativar.')
      }

      chave.ativo = input.active
      return { chave, salas: database.salas }
    })

    return toChaveView(chave, salas)
  },
}

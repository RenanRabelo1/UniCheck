import { withTransaction } from '../../database/sql.js'
import type { TipoChave } from '../../database/types.js'
import { HttpError } from '../../middlewares/httpError.js'
import { temItemEmAndamento } from '../solicitacoes/solicitacao.disponibilidade.js'
import { ROTULO_TIPO_CHAVE, toChaveView, toSalaView } from './chave.mapper.js'
import { chaveRepository } from './chave.repository.js'
import type { CreateChaveInput, CreateSalaInput, UpdateChaveInput, UpdateSalaInput } from './chave.validation.js'

const TIPO_DA_API: Record<CreateChaveInput['type'], TipoChave> = { primary: 'PRIMARIA', secondary: 'SECUNDARIA' }

// Cadastros conferem "já existe?" antes de gravar; a trava faz dois cadastros simultâneos esperarem um pelo outro.
const TRAVA_CADASTRO = 'unicheck:cadastro-sala-chave'

export const salaService = {
  async list() {
    const salas = await chaveRepository.listSalas()
    return salas.map(toSalaView)
  },

  async create(input: CreateSalaInput) {
    const codigo = input.code.toUpperCase()

    const sala = await withTransaction(async (connection) => {
      if (await chaveRepository.salaCodigoExists(codigo, undefined, connection)) {
        throw new HttpError(409, `Já existe uma sala com o código ${codigo}.`)
      }
      return chaveRepository.createSala({ codigo, nome: input.name }, connection)
    }, TRAVA_CADASTRO)

    return toSalaView(sala)
  },

  async update(id: string, input: UpdateSalaInput) {
    return withTransaction(async (connection) => {
      const sala = await chaveRepository.findSala(id, connection)
      if (!sala) throw new HttpError(404, 'Sala não encontrada.')

      const codigo = input.code?.toUpperCase() ?? sala.codigo
      if (await chaveRepository.salaCodigoExists(codigo, id, connection)) {
        throw new HttpError(409, `Já existe uma sala com o código ${codigo}.`)
      }

      if (input.active === false && sala.ativo && (await chaveRepository.salaEmUso(id, connection))) {
        throw new HttpError(409, 'Esta sala tem itens aprovados ou em posse. Aguarde a devolução para inativar.')
      }

      const atualizada = { ...sala, codigo, nome: input.name ?? sala.nome, ativo: input.active ?? sala.ativo }
      await chaveRepository.updateSala(id, atualizada, connection)
      return toSalaView(atualizada)
    }, TRAVA_CADASTRO)
  },
}

export const chaveService = {
  async list() {
    const [chaves, salas] = await Promise.all([chaveRepository.listAll(), chaveRepository.listSalas()])
    return chaves.map((chave) => toChaveView(chave, salas))
  },

  async create(input: CreateChaveInput) {
    const tipo = TIPO_DA_API[input.type]

    return withTransaction(async (connection) => {
      const sala = await chaveRepository.findActiveSala(input.roomId, connection)
      if (!sala) throw new HttpError(400, 'Sala não encontrada.')

      // Uma sala tem no máximo uma chave de cada tipo (primária e secundária).
      if (await chaveRepository.chaveDaSalaExists(sala.id, tipo, connection)) {
        throw new HttpError(
          409,
          `A sala ${sala.codigo} já tem uma chave ${ROTULO_TIPO_CHAVE[tipo].toLowerCase()}. Se estiver inativa, reative-a.`,
        )
      }

      const chave = await chaveRepository.createChave({ sala, tipo }, connection)
      return toChaveView(chave, [sala])
    }, TRAVA_CADASTRO)
  },

  async update(id: string, input: UpdateChaveInput) {
    return withTransaction(async (connection) => {
      const chave = await chaveRepository.findChave(id, connection)
      if (!chave) throw new HttpError(404, 'Chave não encontrada.')

      if (input.active === false && chave.ativo && (await temItemEmAndamento('CHAVE', id, connection))) {
        throw new HttpError(409, 'Esta chave está aprovada ou em posse. Aguarde a devolução para inativar.')
      }

      await chaveRepository.setChaveAtiva(id, input.active, connection)
      return toChaveView({ ...chave, ativo: input.active }, await chaveRepository.listSalas(connection))
    }, TRAVA_CADASTRO)
  },
}

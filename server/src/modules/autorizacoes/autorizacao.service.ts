import { withTransaction } from '../../database/sql.js'
import type { Usuario } from '../../database/types.js'
import { HttpError } from '../../middlewares/httpError.js'
import { todayIso } from '../../utils/dates.js'
import { autorizacaoRepository, projetoRepository, type Autorizacao, type Projeto } from './autorizacao.repository.js'
import type { CreateAutorizacaoInput, CreateProjetoInput } from './autorizacao.validation.js'

// Cadastros conferem "já existe?" antes de gravar; a trava faz dois cadastros simultâneos esperarem um pelo outro.
const TRAVA_CADASTRO = 'unicheck:cadastro-autorizacao'

function toProjetoView(projeto: Projeto) {
  return {
    id: projeto.id,
    name: projeto.nome,
    description: projeto.descricao,
    professor: { id: projeto.professorId, name: projeto.professorNome, active: projeto.professorAtivo },
    active: projeto.ativo,
  }
}

function toAutorizacaoView(autorizacao: Autorizacao) {
  return {
    id: autorizacao.id,
    student: {
      id: autorizacao.alunoId,
      name: autorizacao.alunoNome,
      email: autorizacao.alunoEmail,
      registration: autorizacao.alunoMatricula,
    },
    project: { id: autorizacao.projetoId, name: autorizacao.projetoNome, active: autorizacao.projetoAtivo },
    professor: { id: autorizacao.professorId, name: autorizacao.professorNome, active: autorizacao.professorAtivo },
    coordinator: autorizacao.coordenadorNome,
    authorizedAt: autorizacao.dataAutorizacao,
    inactivatedAt: autorizacao.dataInativacao,
    active: autorizacao.ativa,
    // Mesma regra que libera a chave para o aluno: autorização, projeto e professor ativos.
    canRequestKey: autorizacao.ativa && autorizacao.projetoAtivo && autorizacao.professorAtivo,
  }
}

export const projetoService = {
  async list() {
    const projetos = await projetoRepository.list()
    return projetos.map(toProjetoView)
  },

  async create(input: CreateProjetoInput) {
    return withTransaction(async (connection) => {
      if (!(await autorizacaoRepository.professorAtivoExists(input.professorId, connection))) {
        throw new HttpError(400, 'Professor responsável não encontrado ou inativo.')
      }
      if (await projetoRepository.nomeExists(input.name, connection)) {
        throw new HttpError(409, 'Já existe um projeto com este nome.')
      }
      const id = await projetoRepository.create(
        { nome: input.name, descricao: input.description || undefined, professorId: input.professorId },
        connection,
      )
      return toProjetoView((await projetoRepository.findById(id, connection))!)
    }, TRAVA_CADASTRO)
  },

  /** Inativar não mexe nas autorizações: elas só deixam de liberar chave enquanto o projeto estiver inativo. */
  async setAtivo(id: string, ativo: boolean) {
    return withTransaction(async (connection) => {
      if (!(await projetoRepository.findById(id, connection))) throw new HttpError(404, 'Projeto não encontrado.')
      await projetoRepository.setAtivo(id, ativo, connection)
      return toProjetoView((await projetoRepository.findById(id, connection))!)
    }, TRAVA_CADASTRO)
  },
}

export const autorizacaoService = {
  async list() {
    const autorizacoes = await autorizacaoRepository.list()
    return autorizacoes.map(toAutorizacaoView)
  },

  async options() {
    const [alunos, professores] = await Promise.all([
      autorizacaoRepository.listAlunosAtivos(),
      autorizacaoRepository.listProfessoresAtivos(),
    ])
    return {
      students: alunos.map(({ id, nome, matricula, email }) => ({ id, name: nome, registration: matricula, email })),
      professors: professores.map(({ id, nome, matricula }) => ({ id, name: nome, registration: matricula })),
    }
  },

  async create(coordenador: Usuario, input: CreateAutorizacaoInput, now: Date = new Date()) {
    return withTransaction(async (connection) => {
      if (!(await autorizacaoRepository.alunoAtivoExists(input.studentId, connection))) {
        throw new HttpError(400, 'Aluno não encontrado ou inativo.')
      }
      const projeto = await projetoRepository.findById(input.projectId, connection)
      if (!projeto) throw new HttpError(400, 'Projeto não encontrado.')
      if (!projeto.ativo || !projeto.professorAtivo) {
        throw new HttpError(409, 'O projeto e o professor responsável precisam estar ativos.')
      }
      if (await autorizacaoRepository.ativaExists(input.studentId, input.projectId, undefined, connection)) {
        throw new HttpError(409, 'Este aluno já tem autorização ativa neste projeto.')
      }

      const id = await autorizacaoRepository.create(
        { alunoId: input.studentId, projetoId: input.projectId, coordenadorId: coordenador.id, data: todayIso(now) },
        connection,
      )
      return toAutorizacaoView((await autorizacaoRepository.findById(id, connection))!)
    }, TRAVA_CADASTRO)
  },

  async setAtiva(id: string, ativa: boolean, now: Date = new Date()) {
    return withTransaction(async (connection) => {
      const autorizacao = await autorizacaoRepository.findById(id, connection)
      if (!autorizacao) throw new HttpError(404, 'Autorização não encontrada.')

      if (ativa) {
        if (!autorizacao.projetoAtivo || !autorizacao.professorAtivo) {
          throw new HttpError(409, 'O projeto e o professor responsável precisam estar ativos.')
        }
        if (await autorizacaoRepository.ativaExists(autorizacao.alunoId, autorizacao.projetoId, id, connection)) {
          throw new HttpError(409, 'Este aluno já tem autorização ativa neste projeto.')
        }
      }

      await autorizacaoRepository.setAtiva(id, ativa, todayIso(now), connection)
      return toAutorizacaoView((await autorizacaoRepository.findById(id, connection))!)
    }, TRAVA_CADASTRO)
  },
}

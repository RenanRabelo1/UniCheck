import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { pool } from '../../database/connection.js'
import { parseId, type Db } from '../../database/sql.js'

export type Pessoa = { id: string; nome: string; matricula: string; email: string }

export type Projeto = {
  id: string
  nome: string
  descricao: string | null
  professorId: string
  professorNome: string
  professorAtivo: boolean
  ativo: boolean
}

export type Autorizacao = {
  id: string
  alunoId: string
  alunoNome: string
  alunoEmail: string
  alunoMatricula: string
  projetoId: string
  projetoNome: string
  projetoAtivo: boolean
  professorId: string
  professorNome: string
  professorAtivo: boolean
  coordenadorNome: string
  dataAutorizacao: string
  dataInativacao: string | null
  ativa: boolean
}

type ProjetoRow = RowDataPacket & {
  id_projeto: number
  nome: string
  descricao: string | null
  status: 'ATIVO' | 'INATIVO'
  id_professor: number
  professor: string
  professor_status: 'ATIVO' | 'INATIVO'
}

type AutorizacaoRow = RowDataPacket & {
  id_autorizacao: number
  id_aluno: number
  aluno: string
  email_institucional: string
  matricula: string
  id_projeto: number
  projeto: string
  projeto_status: 'ATIVO' | 'INATIVO'
  id_professor: number
  professor: string
  professor_status: 'ATIVO' | 'INATIVO'
  coordenador: string
  data_autorizacao: string
  data_inativacao: string | null
  status: 'ATIVA' | 'INATIVA'
}

type PessoaRow = RowDataPacket & { id_usuario: number; nome: string; matricula: string; email_institucional: string }

const SELECT_PROJETO = `
  SELECT p.id_projeto, p.nome, p.descricao, p.status, p.id_professor, u.nome AS professor, u.status AS professor_status
  FROM projeto p JOIN usuario u ON u.id_usuario = p.id_professor
`

const SELECT_AUTORIZACAO = `
  SELECT a.id_autorizacao, a.id_aluno, al.nome AS aluno, al.email_institucional, al.matricula,
         a.id_projeto, p.nome AS projeto, p.status AS projeto_status,
         p.id_professor, prof.nome AS professor, prof.status AS professor_status,
         coord.nome AS coordenador, a.data_autorizacao, a.data_inativacao, a.status
  FROM autorizacao a
  JOIN usuario al ON al.id_usuario = a.id_aluno
  JOIN projeto p ON p.id_projeto = a.id_projeto
  JOIN usuario prof ON prof.id_usuario = p.id_professor
  JOIN usuario coord ON coord.id_usuario = a.id_coordenador
`

const toProjeto = (row: ProjetoRow): Projeto => ({
  id: String(row.id_projeto),
  nome: row.nome,
  descricao: row.descricao,
  professorId: String(row.id_professor),
  professorNome: row.professor,
  professorAtivo: row.professor_status === 'ATIVO',
  ativo: row.status === 'ATIVO',
})

const toAutorizacao = (row: AutorizacaoRow): Autorizacao => ({
  id: String(row.id_autorizacao),
  alunoId: String(row.id_aluno),
  alunoNome: row.aluno,
  alunoEmail: row.email_institucional,
  alunoMatricula: row.matricula,
  projetoId: String(row.id_projeto),
  projetoNome: row.projeto,
  projetoAtivo: row.projeto_status === 'ATIVO',
  professorId: String(row.id_professor),
  professorNome: row.professor,
  professorAtivo: row.professor_status === 'ATIVO',
  coordenadorNome: row.coordenador,
  dataAutorizacao: row.data_autorizacao,
  dataInativacao: row.data_inativacao,
  ativa: row.status === 'ATIVA',
})

const toPessoa = (row: PessoaRow): Pessoa => ({
  id: String(row.id_usuario),
  nome: row.nome,
  matricula: row.matricula,
  email: row.email_institucional,
})

export const projetoRepository = {
  async list(db: Db = pool): Promise<Projeto[]> {
    const [rows] = await db.query<ProjetoRow[]>(`${SELECT_PROJETO} ORDER BY p.nome`)
    return rows.map(toProjeto)
  },

  async findById(id: string, db: Db = pool): Promise<Projeto | undefined> {
    const numericId = parseId(id)
    if (numericId === undefined) return undefined
    const [rows] = await db.execute<ProjetoRow[]>(`${SELECT_PROJETO} WHERE p.id_projeto = ?`, [numericId])
    return rows[0] ? toProjeto(rows[0]) : undefined
  },

  async nomeExists(nome: string, db: Db = pool): Promise<boolean> {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT id_projeto FROM projeto WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?))', [nome])
    return rows.length > 0
  },

  async create(data: { nome: string; descricao?: string; professorId: string }, db: Db): Promise<string> {
    const [result] = await db.execute<ResultSetHeader>('INSERT INTO projeto (id_professor, nome, descricao) VALUES (?, ?, ?)', [
      parseId(data.professorId) ?? 0,
      data.nome,
      data.descricao ?? null,
    ])
    return String(result.insertId)
  },

  async setAtivo(id: string, ativo: boolean, db: Db): Promise<void> {
    await db.execute('UPDATE projeto SET status = ? WHERE id_projeto = ?', [ativo ? 'ATIVO' : 'INATIVO', parseId(id) ?? 0])
  },
}

export const autorizacaoRepository = {
  async list(db: Db = pool): Promise<Autorizacao[]> {
    const [rows] = await db.query<AutorizacaoRow[]>(`${SELECT_AUTORIZACAO} ORDER BY a.status, al.nome, a.id_autorizacao DESC`)
    return rows.map(toAutorizacao)
  },

  async findById(id: string, db: Db = pool): Promise<Autorizacao | undefined> {
    const numericId = parseId(id)
    if (numericId === undefined) return undefined
    const [rows] = await db.execute<AutorizacaoRow[]>(`${SELECT_AUTORIZACAO} WHERE a.id_autorizacao = ?`, [numericId])
    return rows[0] ? toAutorizacao(rows[0]) : undefined
  },

  /** O aluno já tem autorização ativa neste projeto? */
  async ativaExists(alunoId: string, projetoId: string, exceptId: string | undefined, db: Db): Promise<boolean> {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT id_autorizacao FROM autorizacao
       WHERE id_aluno = ? AND id_projeto = ? AND status = 'ATIVA' AND id_autorizacao <> ?`,
      [parseId(alunoId) ?? 0, parseId(projetoId) ?? 0, parseId(exceptId ?? '') ?? 0],
    )
    return rows.length > 0
  },

  async create(data: { alunoId: string; projetoId: string; coordenadorId: string; data: string }, db: Db): Promise<string> {
    const [result] = await db.execute<ResultSetHeader>(
      'INSERT INTO autorizacao (id_aluno, id_projeto, id_coordenador, data_autorizacao) VALUES (?, ?, ?, ?)',
      [parseId(data.alunoId) ?? 0, parseId(data.projetoId) ?? 0, parseId(data.coordenadorId) ?? 0, data.data],
    )
    return String(result.insertId)
  },

  /** O CHECK ck_autorizacao_inativacao exige a data quando INATIVA e nenhuma quando ATIVA. */
  async setAtiva(id: string, ativa: boolean, data: string, db: Db): Promise<void> {
    await db.execute('UPDATE autorizacao SET status = ?, data_inativacao = ? WHERE id_autorizacao = ?', [
      ativa ? 'ATIVA' : 'INATIVA',
      ativa ? null : data,
      parseId(id) ?? 0,
    ])
  },

  async listAlunosAtivos(db: Db = pool): Promise<Pessoa[]> {
    return listarPessoas('aluno', 'id_aluno', db)
  },

  async listProfessoresAtivos(db: Db = pool): Promise<Pessoa[]> {
    return listarPessoas('professor', 'id_professor', db)
  },

  async alunoAtivoExists(id: string, db: Db): Promise<boolean> {
    return pessoaAtivaExists('aluno', 'id_aluno', id, db)
  },

  async professorAtivoExists(id: string, db: Db): Promise<boolean> {
    return pessoaAtivaExists('professor', 'id_professor', id, db)
  },
}

async function listarPessoas(tabela: 'aluno' | 'professor', coluna: string, db: Db): Promise<Pessoa[]> {
  const [rows] = await db.query<PessoaRow[]>(
    `SELECT u.id_usuario, u.nome, u.matricula, u.email_institucional
     FROM usuario u JOIN ${tabela} t ON t.${coluna} = u.id_usuario
     WHERE u.status = 'ATIVO' ORDER BY u.nome`,
  )
  return rows.map(toPessoa)
}

async function pessoaAtivaExists(tabela: 'aluno' | 'professor', coluna: string, id: string, db: Db): Promise<boolean> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT 1 FROM usuario u JOIN ${tabela} t ON t.${coluna} = u.id_usuario WHERE u.id_usuario = ? AND u.status = 'ATIVO'`,
    [parseId(id) ?? 0],
  )
  return rows.length > 0
}

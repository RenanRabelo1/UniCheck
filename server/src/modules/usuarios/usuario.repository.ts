import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { pool } from '../../database/connection.js'
import { parseId } from '../../database/sql.js'
import type { Perfil, Usuario } from '../../database/types.js'
import { HttpError } from '../../middlewares/httpError.js'

/** Perfis que podem ser criados pelo cadastro (o MER não tem Funcionário). */
export type PerfilCadastro = Extract<Perfil, 'ALUNO' | 'PROFESSOR' | 'COORDENADOR'>

export type NovoUsuario = {
  nome: string
  email: string
  matricula: string
  contato?: string
  perfil: PerfilCadastro
  /** Dado específico do perfil: curso (aluno), área/departamento (professor) ou setor (coordenador). */
  detalhe: string
  senhaHash: string
}

type UsuarioRow = RowDataPacket & {
  id_usuario: number
  nome: string
  matricula: string
  email_institucional: string
  senha_hash: string
  perfil: Perfil
  status: 'ATIVO' | 'INATIVO'
  projeto: string | null
  professor_id: number | null
}

// A autorização ativa mais recente do aluno (projeto e professor responsável). Só alunos têm.
const SELECT_USUARIO = `
  SELECT u.id_usuario, u.nome, u.matricula, u.email_institucional, u.senha_hash, u.perfil, u.status,
    (SELECT p.nome FROM autorizacao a JOIN projeto p ON p.id_projeto = a.id_projeto
      WHERE a.id_aluno = u.id_usuario AND a.status = 'ATIVA' ORDER BY a.id_autorizacao DESC LIMIT 1) AS projeto,
    (SELECT p.id_professor FROM autorizacao a JOIN projeto p ON p.id_projeto = a.id_projeto
      WHERE a.id_aluno = u.id_usuario AND a.status = 'ATIVA' ORDER BY a.id_autorizacao DESC LIMIT 1) AS professor_id
  FROM usuario u
`

function toUsuario(row: UsuarioRow): Usuario {
  const autorizado = row.projeto !== null && row.professor_id !== null
  return {
    id: String(row.id_usuario),
    nome: row.nome,
    identificador: row.email_institucional,
    matricula: row.matricula,
    perfil: row.perfil,
    autorizado,
    autorizacao: autorizado ? { projeto: row.projeto!, professorResponsavelId: String(row.professor_id) } : undefined,
    ativo: row.status === 'ATIVO',
    senhaHash: row.senha_hash,
  }
}

export const usuarioRepository = {
  async listAll(): Promise<Usuario[]> {
    const [rows] = await pool.query<UsuarioRow[]>(SELECT_USUARIO)
    return rows.map(toUsuario)
  },

  /** Aceita o e-mail institucional (sem diferenciar maiúsculas) ou a matrícula. */
  async findByIdentificador(identificador: string): Promise<Usuario | undefined> {
    const normalized = identificador.trim()
    const [rows] = await pool.execute<UsuarioRow[]>(
      `${SELECT_USUARIO} WHERE LOWER(u.email_institucional) = LOWER(?) OR u.matricula = ? LIMIT 1`,
      [normalized, normalized],
    )
    return rows[0] ? toUsuario(rows[0]) : undefined
  },

  async findById(id: string): Promise<Usuario | undefined> {
    const numericId = parseId(id)
    if (numericId === undefined) return undefined
    const [rows] = await pool.execute<UsuarioRow[]>(`${SELECT_USUARIO} WHERE u.id_usuario = ? LIMIT 1`, [numericId])
    return rows[0] ? toUsuario(rows[0]) : undefined
  },

  /**
   * Cria o usuário e a linha do perfil (aluno, professor ou coordenador) numa transação:
   * ou grava as duas, ou nenhuma.
   */
  async create(novo: NovoUsuario): Promise<Usuario> {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO usuario (nome, matricula, email_institucional, senha_hash, contato, perfil)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [novo.nome, novo.matricula, novo.email, novo.senhaHash, novo.contato ?? null, novo.perfil],
      )
      const id = result.insertId

      if (novo.perfil === 'PROFESSOR') {
        await connection.execute('INSERT INTO professor (id_professor, area_departamento) VALUES (?, ?)', [id, novo.detalhe])
      } else if (novo.perfil === 'ALUNO') {
        await connection.execute('INSERT INTO aluno (id_aluno, dados_academicos) VALUES (?, ?)', [id, novo.detalhe])
      } else {
        await connection.execute('INSERT INTO coordenador_cct (id_coordenador, dados_administrativos) VALUES (?, ?)', [
          id,
          novo.detalhe,
        ])
      }

      await connection.commit()
      return {
        id: String(id),
        nome: novo.nome,
        identificador: novo.email,
        matricula: novo.matricula,
        perfil: novo.perfil,
        autorizado: false,
        ativo: true,
        senhaHash: novo.senhaHash,
      }
    } catch (error) {
      await connection.rollback()
      // As colunas e-mail e matrícula são UNIQUE: duas pessoas se cadastrando ao mesmo tempo caem aqui.
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
        const message = (error as Error).message
        throw new HttpError(409, message.includes('uq_usuario_matricula') ? 'Matrícula já cadastrada.' : 'E-mail já cadastrado.')
      }
      throw error
    } finally {
      connection.release()
    }
  },
}

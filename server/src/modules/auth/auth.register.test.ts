import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createTestApp } from '../../testing/testApp.js'
import { registerSchema } from './auth.validation.js'

const valid = {
  role: 'student',
  name: 'Maria da Silva',
  email: ' Maria.Silva@unifor.br ',
  registration: '2412345',
  detail: 'Ciência da Computação',
  password: 'Senha-segura-123!',
}

describe('cadastro: validação', () => {
  it('normaliza e-mail e remove contato vazio', () => {
    const parsed = registerSchema.parse({ ...valid, phone: '  ' })
    expect(parsed.email).toBe('maria.silva@unifor.br')
    expect(parsed.phone).toBeUndefined()
  })

  it('recusa perfil desconhecido, e-mail inválido e senha curta', () => {
    expect(registerSchema.safeParse({ ...valid, role: 'staff' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...valid, email: 'sem-arroba' }).success).toBe(false)
    expect(registerSchema.safeParse({ ...valid, password: 'Ab1!' }).success).toBe(false)
  })

  it('lista só o que falta na senha', () => {
    const message = (password: string) => registerSchema.safeParse({ ...valid, password }).error?.issues[0]?.message
    expect(message('abc')).toBe('A senha precisa ter no mínimo 8 caracteres, 1 letra maiúscula e 1 caractere especial.')
    expect(message('abcdefgh!')).toBe('A senha precisa ter 1 letra maiúscula.')
    expect(message('Abcdefgh1')).toBe('A senha precisa ter 1 caractere especial.')
    expect(message('Abcdefg!')).toBeUndefined()
  })

  it('exige o campo específico do perfil', () => {
    expect(registerSchema.safeParse({ ...valid, detail: '' }).success).toBe(false)
  })
})

describe('POST /auth/register', () => {
  it('responde 400 para dados inválidos, sem tocar no banco', async () => {
    const app = await createTestApp()
    const response = await request(app).post('/auth/register').send({ ...valid, password: 'curtinha' })
    expect(response.status).toBe(400)
    expect(response.body.message).toBe('A senha precisa ter 1 letra maiúscula e 1 caractere especial.')
  })

  it('responde 409 quando o e-mail já existe no usuário de demonstração', async () => {
    const app = await createTestApp()
    const response = await request(app)
      .post('/auth/register')
      .send({ ...valid, email: 'aluno.autorizado@unifor.br' })
    // O JSON é consultado primeiro; mas a checagem estrita também consulta o MySQL só se não achar no JSON.
    expect(response.status).toBe(409)
    expect(response.body.message).toBe('E-mail já cadastrado.')
  })
})

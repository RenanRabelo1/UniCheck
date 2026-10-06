import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp, type TestApp } from '../../testing/testApp.js'

let app: TestApp

beforeAll(async () => {
  app = await createTestApp()
})
afterAll(() => {
  delete process.env.DATA_FILE
})
const PASSWORD = 'unicheck123'

async function loginAs(identifier: string, role?: string) {
  const response = await request(app).post('/auth/login').send({ identifier, password: PASSWORD, role })
  return response
}

describe('POST /auth/login', () => {
  it('autentica o professor e devolve token e sessão', async () => {
    const response = await loginAs('2048819', 'professor')
    expect(response.status).toBe(200)
    expect(response.body.token).toEqual(expect.any(String))
    expect(response.body.user).toMatchObject({ name: 'Prof. Ricardo Mendes', role: 'professor', registration: '2048819/CCT' })
  })

  it('rejeita senha errada', async () => {
    const response = await request(app).post('/auth/login').send({ identifier: '2048819', password: 'errada' })
    expect(response.status).toBe(401)
  })

  it('rejeita perfil diferente do usuário', async () => {
    const response = await loginAs('2048819', 'student')
    expect(response.status).toBe(401)
  })

  it('valida campos obrigatórios', async () => {
    const response = await request(app).post('/auth/login').send({ identifier: '2048819' })
    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Informe sua senha.')
  })
})

describe('GET /dashboard', () => {
  it('exige autenticação', async () => {
    expect((await request(app).get('/dashboard')).status).toBe(401)
    expect((await request(app).get('/dashboard').set('Authorization', 'Bearer abc')).status).toBe(401)
  })

  it('devolve o painel do professor no formato esperado pelo front', async () => {
    const { body: session } = await loginAs('2048819')
    const response = await request(app).get('/dashboard').set('Authorization', `Bearer ${session.token}`)

    expect(response.status).toBe(200)
    expect(response.body.user).toMatchObject({ role: 'professor', roleLabel: 'Professor' })
    expect(response.body.summary).toEqual({ pending: 1, approved: 2, inPossession: 3 })
    expect(response.body.recentActivity).toHaveLength(5)
    expect(response.body.recentActivity[0]).toMatchObject({
      title: 'Notebook Dell Latitude + carregador',
      status: 'Aprovada',
      tone: 'approved',
    })
    for (const item of response.body.recentActivity) {
      expect(['approved', 'active', 'returned']).toContain(item.tone)
    }
  })

  it('mostra só os dados do próprio aluno', async () => {
    const { body: session } = await loginAs('aluno.autorizado@unifor.br', 'student')
    const response = await request(app).get('/dashboard').set('Authorization', `Bearer ${session.token}`)

    expect(response.status).toBe(200)
    expect(response.body.user.roleLabel).toBe('Aluno autorizado')
    expect(response.body.summary).toEqual({ pending: 1, approved: 0, inPossession: 1 })
  })

  it('devolve painel vazio para aluno sem solicitações', async () => {
    const { body: session } = await loginAs('aluno.naoautorizado@unifor.br')
    const response = await request(app).get('/dashboard').set('Authorization', `Bearer ${session.token}`)

    expect(response.status).toBe(200)
    expect(response.body.summary).toEqual({ pending: 0, approved: 0, inPossession: 0 })
    expect(response.body.recentActivity).toEqual([])
  })

  it('bloqueia o coordenador (painel próprio ainda não existe)', async () => {
    const { body: session } = await loginAs('18024900', 'coordinator')
    const response = await request(app).get('/dashboard').set('Authorization', `Bearer ${session.token}`)
    expect(response.status).toBe(403)
  })
})

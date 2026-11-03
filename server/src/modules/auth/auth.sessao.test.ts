import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { start } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())

const NOW = '2026-10-05T12:00:00-03:00'
const SENHA = 'unicheck123'
type Ctx = Awaited<ReturnType<typeof start>>

const login = (ctx: Ctx, identifier: string, role?: string, password = SENHA) =>
  request(ctx.app).post('/auth/login').send({ identifier, password, role })

describe('identificação por perfil (RF01.6 a RF01.9)', () => {
  it('aluno entra com o e-mail institucional; professor e coordenador com a matrícula', async () => {
    const ctx = await start(NOW)
    expect((await login(ctx, 'aluno.autorizado@unifor.br', 'student')).status).toBe(200)
    expect((await login(ctx, '2048819', 'professor')).status).toBe(200)
    expect((await login(ctx, '18024900', 'coordinator')).status).toBe(200)
  })

  it('recusa o identificador do tipo errado para o perfil escolhido', async () => {
    const ctx = await start(NOW)
    const aluno = await login(ctx, '2412001', 'student')
    expect(aluno.status).toBe(401)
    expect(aluno.body.message).toBe('Aluno entra com o e-mail institucional.')

    const professor = await login(ctx, 'ricardo.mendes@unifor.br', 'professor')
    expect(professor.status).toBe(401)
    expect(professor.body.message).toBe('Este perfil entra com a matrícula.')
  })
})

describe('sessão', () => {
  it('GET /auth/me devolve o usuário do token', async () => {
    const ctx = await start(NOW)
    const response = await request(ctx.app).get('/auth/me').set('Authorization', ctx.coord)
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ name: 'Coordenação CCT', role: 'coordinator' })
    expect(response.body.senhaHash).toBeUndefined()
    expect((await request(ctx.app).get('/auth/me')).status).toBe(401)
  })

  it('sair invalida o token no servidor (RF24.2)', async () => {
    const ctx = await start(NOW)
    expect((await request(ctx.app).post('/auth/logout').set('Authorization', ctx.professor)).status).toBe(204)

    const depois = await request(ctx.app).get('/dashboard').set('Authorization', ctx.professor)
    expect(depois.status).toBe(401)
    // A outra sessão do sistema continua valendo.
    expect((await request(ctx.app).get('/admin/materiais').set('Authorization', ctx.coord)).status).toBe(200)
  })

  it('sair exige estar autenticado', async () => {
    const ctx = await start(NOW)
    expect((await request(ctx.app).post('/auth/logout')).status).toBe(401)
  })
})

describe('limite de tentativas de login', () => {
  it('bloqueia a conta nesta origem depois de muitas senhas erradas, sem afetar outra conta', async () => {
    const ctx = await start(NOW)
    const statuses: number[] = []
    for (let tentativa = 0; tentativa < 11; tentativa += 1) {
      statuses.push((await login(ctx, '18024900', 'coordinator', 'senha-errada')).status)
    }
    expect(statuses.slice(0, 10).every((status) => status === 401)).toBe(true)
    expect(statuses[10]).toBe(429)

    const bloqueado = await login(ctx, '18024900', 'coordinator')
    expect(bloqueado.status).toBe(429)
    expect(bloqueado.body.message).toContain('Muitas tentativas')
    expect((await login(ctx, '2048819', 'professor')).status).toBe(200)
  })
})

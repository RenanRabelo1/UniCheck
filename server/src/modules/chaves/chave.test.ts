import request from 'supertest'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { start } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())
afterAll(() => {
  delete process.env.DATA_FILE
})

const NOW = '2026-10-05T12:00:00-03:00'
type Ctx = Awaited<ReturnType<typeof start>>

const send = (ctx: Ctx, method: 'post' | 'patch', url: string, body: object, token = ctx.coord) =>
  request(ctx.app)[method](url).set('Authorization', token).send(body)
const optionsDoAluno = (ctx: Ctx) => request(ctx.app).get('/solicitacoes/opcoes').set('Authorization', ctx.aluno)
const optionsDoProfessor = (ctx: Ctx) => request(ctx.app).get('/solicitacoes/opcoes').set('Authorization', ctx.professor)

describe('salas', () => {
  it('lista, e só Coordenação e Secretaria consultam', async () => {
    const ctx = await start(NOW)
    const response = await request(ctx.app).get('/admin/salas').set('Authorization', ctx.staff)
    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(3)
    expect(response.body[0]).toEqual({ id: 'j-201', code: 'J-201', name: 'Laboratório de Redes', active: true })
    expect((await request(ctx.app).get('/admin/salas').set('Authorization', ctx.aluno)).status).toBe(403)
  })

  it('cria a sala e ela aparece nas opções do formulário', async () => {
    const ctx = await start(NOW)
    const response = await send(ctx, 'post', '/admin/salas', { code: 'j-205', name: 'Laboratório de IoT' })
    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: 'j-205', code: 'J-205', name: 'Laboratório de IoT', active: true })

    const opcoes = await optionsDoProfessor(ctx)
    expect(opcoes.body.rooms).toContainEqual({ value: 'j-205', label: 'J-205 · Laboratório de IoT' })
  })

  it('rejeita código repetido ou inválido', async () => {
    const ctx = await start(NOW)
    expect((await send(ctx, 'post', '/admin/salas', { code: 'J-201', name: 'Outra' })).status).toBe(409)
    expect((await send(ctx, 'post', '/admin/salas', { code: 'sala 1!', name: 'Outra' })).status).toBe(400)
    expect((await send(ctx, 'post', '/admin/salas', { code: 'J-206' })).status).toBe(400)
  })

  it('altera o nome da sala', async () => {
    const ctx = await start(NOW)
    const response = await send(ctx, 'patch', '/admin/salas/j-311', { name: 'Sala de Projetos Integrados' })
    expect(response.body.name).toBe('Sala de Projetos Integrados')
  })

  it('não inativa sala com item aprovado ou em posse', async () => {
    const ctx = await start(NOW)
    // j-201 tem o projetor e a chave em posse hoje.
    const response = await send(ctx, 'patch', '/admin/salas/j-201', { active: false })
    expect(response.status).toBe(409)
  })

  it('inativa sala sem uso: some das opções e não aceita novos pedidos', async () => {
    const ctx = await start(NOW)
    await send(ctx, 'post', '/admin/salas', { code: 'J-205', name: 'Laboratório de IoT' })
    expect((await send(ctx, 'patch', '/admin/salas/j-205', { active: false })).body.active).toBe(false)

    const rooms = (await optionsDoProfessor(ctx)).body.rooms.map((room: { value: string }) => room.value)
    expect(rooms).not.toContain('j-205')

    const pedido = await send(
      ctx,
      'post',
      '/solicitacoes',
      { date: '2026-10-08', room: 'j-205', pickupTime: '09:00', returnTime: '11:00', items: [{ id: 'mat-hdmi' }] },
      ctx.professor,
    )
    expect(pedido.status).toBe(400)
    expect(pedido.body.message).toBe('Sala não encontrada.')

    // A sala inativa continua listada no cadastro (nada é apagado) e no histórico.
    const cadastro = await request(ctx.app).get('/admin/salas').set('Authorization', ctx.coord)
    expect(cadastro.body.find((sala: { id: string }) => sala.id === 'j-205').active).toBe(false)
  })
})

describe('chaves', () => {
  it('lista as chaves com a sala', async () => {
    const ctx = await start(NOW)
    const response = await request(ctx.app).get('/admin/chaves').set('Authorization', ctx.coord)
    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(4)
    expect(response.body[0]).toEqual({
      id: 'chv-j201-p',
      room: { value: 'j-201', label: 'J-201 · Laboratório de Redes' },
      type: 'primary',
      typeLabel: 'Primária',
      active: true,
    })
  })

  it('cria a chave secundária e o aluno autorizado passa a vê-la', async () => {
    const ctx = await start(NOW)
    const response = await send(ctx, 'post', '/admin/chaves', { roomId: 'j-201', type: 'secondary' })
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({ type: 'secondary', typeLabel: 'Secundária', active: true })

    const opcoes = await optionsDoAluno(ctx)
    expect(opcoes.body.keysByRoom['j-201']).toHaveLength(2)
  })

  it('não repete o tipo na mesma sala nem usa sala inexistente', async () => {
    const ctx = await start(NOW)
    const repetida = await send(ctx, 'post', '/admin/chaves', { roomId: 'j-204', type: 'primary' })
    expect(repetida.status).toBe(409)
    expect((await send(ctx, 'post', '/admin/chaves', { roomId: 'j-999', type: 'primary' })).status).toBe(400)
    expect((await send(ctx, 'post', '/admin/chaves', { roomId: 'j-204', type: 'terciaria' })).status).toBe(400)
  })

  it('não inativa chave em posse', async () => {
    const ctx = await start(NOW)
    const response = await send(ctx, 'patch', '/admin/chaves/chv-j201-p', { active: false }) // item-008
    expect(response.status).toBe(409)
  })

  it('inativa e reativa uma chave sem uso', async () => {
    const ctx = await start(NOW)
    expect((await send(ctx, 'patch', '/admin/chaves/chv-j204-p', { active: false })).body.active).toBe(false)
    const inativa = await optionsDoAluno(ctx)
    expect(inativa.body.keysByRoom['j-204'].map((chave: { value: string }) => chave.value)).toEqual(['chv-j204-s'])

    expect((await send(ctx, 'patch', '/admin/chaves/chv-j204-p', { active: true })).body.active).toBe(true)
    expect((await optionsDoAluno(ctx)).body.keysByRoom['j-204']).toHaveLength(2)
  })

  it('só a Coordenação altera, e 404 para chave inexistente', async () => {
    const ctx = await start(NOW)
    expect((await send(ctx, 'post', '/admin/chaves', { roomId: 'j-204', type: 'secondary' }, ctx.staff)).status).toBe(403)
    expect((await send(ctx, 'patch', '/admin/chaves/chv-999', { active: false })).status).toBe(404)
    expect((await send(ctx, 'patch', '/admin/chaves/chv-j204-p', {})).status).toBe(400)
  })
})

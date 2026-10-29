import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { start } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())

const NOW = '2026-10-05T12:00:00-03:00'
type Ctx = Awaited<ReturnType<typeof start>>

const send = (ctx: Ctx, method: 'post' | 'patch', url: string, body: object, token = ctx.coord) =>
  request(ctx.app)[method](url).set('Authorization', token).send(body)
const optionsDoAluno = (ctx: Ctx) => request(ctx.app).get('/solicitacoes/opcoes').set('Authorization', ctx.aluno)
/** Chaves de uma sala na lista única de itens da Nova solicitação. */
const chavesDaSala = (opcoes: { items: { type: string; id: string; roomId: string | null }[] }, salaId: string) =>
  opcoes.items.filter((item) => item.type === 'key' && item.roomId === salaId)
const optionsDoProfessor = (ctx: Ctx) => request(ctx.app).get('/solicitacoes/opcoes').set('Authorization', ctx.professor)

describe('salas', () => {
  it('lista, e só Coordenação e Secretaria consultam', async () => {
    const ctx = await start(NOW)
    const response = await request(ctx.app).get('/admin/salas').set('Authorization', ctx.coord)
    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(3)
    expect(response.body[0]).toEqual({ id: '1001', code: 'J-201', name: 'Laboratório de Redes', active: true })
    expect((await request(ctx.app).get('/admin/salas').set('Authorization', ctx.aluno)).status).toBe(403)
  })

  it('cria a sala e ela aparece nas opções do formulário', async () => {
    const ctx = await start(NOW)
    const response = await send(ctx, 'post', '/admin/salas', { code: 'j-205', name: 'Laboratório de IoT' })
    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: expect.any(String), code: 'J-205', name: 'Laboratório de IoT', active: true })

    const opcoes = await optionsDoProfessor(ctx)
    expect(opcoes.body.rooms).toContainEqual({ value: response.body.id, label: 'J-205 · Laboratório de IoT' })
  })

  it('rejeita código repetido ou inválido', async () => {
    const ctx = await start(NOW)
    expect((await send(ctx, 'post', '/admin/salas', { code: 'J-201', name: 'Outra' })).status).toBe(409)
    expect((await send(ctx, 'post', '/admin/salas', { code: 'sala 1!', name: 'Outra' })).status).toBe(400)
    expect((await send(ctx, 'post', '/admin/salas', { code: 'J-206' })).status).toBe(400)
  })

  it('altera o nome da sala', async () => {
    const ctx = await start(NOW)
    const response = await send(ctx, 'patch', '/admin/salas/1003', { name: 'Sala de Projetos Integrados' })
    expect(response.body.name).toBe('Sala de Projetos Integrados')
  })

  it('não inativa sala com item aprovado ou em posse', async () => {
    const ctx = await start(NOW)
    // 1001 tem o projetor e a chave em posse hoje.
    const response = await send(ctx, 'patch', '/admin/salas/1001', { active: false })
    expect(response.status).toBe(409)
  })

  it('inativa sala sem uso: some das opções e não aceita novos pedidos', async () => {
    const ctx = await start(NOW)
    const nova = await send(ctx, 'post', '/admin/salas', { code: 'J-205', name: 'Laboratório de IoT' })
    const salaId = nova.body.id as string
    expect((await send(ctx, 'patch', `/admin/salas/${salaId}`, { active: false })).body.active).toBe(false)

    const rooms = (await optionsDoProfessor(ctx)).body.rooms.map((room: { value: string }) => room.value)
    expect(rooms).not.toContain(salaId)

    const pedido = await send(
      ctx,
      'post',
      '/solicitacoes',
      { date: '2026-10-08', room: salaId, pickupTime: '09:00', returnTime: '11:00', items: [{ type: 'material', id: '1003' }] },
      ctx.professor,
    )
    expect(pedido.status).toBe(400)
    expect(pedido.body.message).toBe('Sala não encontrada.')

    // A sala inativa continua listada no cadastro (nada é apagado) e no histórico.
    const cadastro = await request(ctx.app).get('/admin/salas').set('Authorization', ctx.coord)
    expect(cadastro.body.find((sala: { id: string }) => sala.id === salaId).active).toBe(false)
  })
})

describe('chaves', () => {
  it('lista as chaves com a sala', async () => {
    const ctx = await start(NOW)
    const response = await request(ctx.app).get('/admin/chaves').set('Authorization', ctx.coord)
    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(4)
    expect(response.body[0]).toEqual({
      id: '1001',
      room: { value: '1001', label: 'J-201 · Laboratório de Redes' },
      type: 'primary',
      typeLabel: 'Primária',
      active: true,
    })
  })

  it('cria a chave secundária e o aluno autorizado passa a vê-la', async () => {
    const ctx = await start(NOW)
    const response = await send(ctx, 'post', '/admin/chaves', { roomId: '1001', type: 'secondary' })
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({ type: 'secondary', typeLabel: 'Secundária', active: true })

    const opcoes = await optionsDoAluno(ctx)
    expect(chavesDaSala(opcoes.body, '1001')).toHaveLength(2)
  })

  it('não repete o tipo na mesma sala nem usa sala inexistente', async () => {
    const ctx = await start(NOW)
    const repetida = await send(ctx, 'post', '/admin/chaves', { roomId: '1002', type: 'primary' })
    expect(repetida.status).toBe(409)
    expect((await send(ctx, 'post', '/admin/chaves', { roomId: '9999', type: 'primary' })).status).toBe(400)
    expect((await send(ctx, 'post', '/admin/chaves', { roomId: '1002', type: 'terciaria' })).status).toBe(400)
  })

  it('não inativa chave em posse', async () => {
    const ctx = await start(NOW)
    const response = await send(ctx, 'patch', '/admin/chaves/1001', { active: false }) // 1008
    expect(response.status).toBe(409)
  })

  it('inativa e reativa uma chave sem uso', async () => {
    const ctx = await start(NOW)
    expect((await send(ctx, 'patch', '/admin/chaves/1002', { active: false })).body.active).toBe(false)
    const inativa = await optionsDoAluno(ctx)
    expect(chavesDaSala(inativa.body, '1002').map((chave) => chave.id)).toEqual(['1003'])

    expect((await send(ctx, 'patch', '/admin/chaves/1002', { active: true })).body.active).toBe(true)
    expect(chavesDaSala((await optionsDoAluno(ctx)).body, '1002')).toHaveLength(2)
  })

  it('só a Coordenação altera, e 404 para chave inexistente', async () => {
    const ctx = await start(NOW)
    expect((await send(ctx, 'post', '/admin/chaves', { roomId: '1002', type: 'secondary' }, ctx.professor)).status).toBe(403)
    expect((await send(ctx, 'patch', '/admin/chaves/9999', { active: false })).status).toBe(404)
    expect((await send(ctx, 'patch', '/admin/chaves/1002', {})).status).toBe(400)
  })
})

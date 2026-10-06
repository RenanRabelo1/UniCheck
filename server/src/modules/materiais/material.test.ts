import request from 'supertest'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { start } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())
afterAll(() => {
  delete process.env.DATA_FILE
})

const NOW = '2026-10-05T12:00:00-03:00'
type Ctx = Awaited<ReturnType<typeof start>>

const create = (ctx: Ctx, body: object, token = ctx.coord) =>
  request(ctx.app).post('/admin/materiais').set('Authorization', token).send(body)
const patch = (ctx: Ctx, id: string, body: object, token = ctx.coord) =>
  request(ctx.app).patch(`/admin/materiais/${id}`).set('Authorization', token).send(body)
const options = (ctx: Ctx) => request(ctx.app).get('/solicitacoes/opcoes').set('Authorization', ctx.professor)

describe('GET /admin/materiais', () => {
  it('lista o cadastro com a quantidade já comprometida', async () => {
    const ctx = await start(NOW)
    const response = await request(ctx.app).get('/admin/materiais').set('Authorization', ctx.coord)
    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(4)
    // Notebook: item-001 (aprovado, 06/10) + item-005 (em posse hoje) = 2 comprometidos.
    expect(response.body.find((item: { id: string }) => item.id === 'mat-notebook')).toMatchObject({
      totalQuantity: 6,
      committed: 2,
      active: true,
    })
  })

  it('a Secretaria consulta, mas professor não', async () => {
    const ctx = await start(NOW)
    expect((await request(ctx.app).get('/admin/materiais').set('Authorization', ctx.staff)).status).toBe(200)
    expect((await request(ctx.app).get('/admin/materiais').set('Authorization', ctx.professor)).status).toBe(403)
  })

  it('filtra por ativos e inativos', async () => {
    const ctx = await start(NOW)
    const novo = await create(ctx, { name: 'Mesa digitalizadora', totalQuantity: 2 })
    await patch(ctx, novo.body.id, { active: false })

    const inativos = await request(ctx.app).get('/admin/materiais?active=false').set('Authorization', ctx.coord)
    expect(inativos.body.map((item: { name: string }) => item.name)).toEqual(['Mesa digitalizadora'])
    expect((await request(ctx.app).get('/admin/materiais?active=talvez').set('Authorization', ctx.coord)).status).toBe(400)
  })
})

describe('POST /admin/materiais', () => {
  it('cria o material e ele já aparece nas opções do professor', async () => {
    const ctx = await start(NOW)
    const response = await create(ctx, { name: 'Mesa digitalizadora', detail: 'Patrimônio #30001', totalQuantity: 3 })
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({ name: 'Mesa digitalizadora', detail: 'Patrimônio #30001', totalQuantity: 3, committed: 0, active: true })

    const opcoes = await options(ctx)
    expect(opcoes.body.materials).toContainEqual({
      value: response.body.id,
      label: 'Mesa digitalizadora · Patrimônio #30001',
      available: 3,
    })
  })

  it.each([
    ['sem nome', { totalQuantity: 2 }, 'Informe o nome do material.'],
    ['quantidade zero', { name: 'Mouse', totalQuantity: 0 }, 'A quantidade total mínima é 1.'],
    ['quantidade quebrada', { name: 'Mouse', totalQuantity: 1.5 }, 'A quantidade total deve ser um número inteiro.'],
    ['sem quantidade', { name: 'Mouse' }, 'Informe a quantidade total.'],
  ])('rejeita %s', async (_nome, body, message) => {
    const ctx = await start(NOW)
    const response = await create(ctx, body)
    expect(response.status).toBe(400)
    expect(response.body.message).toBe(message)
  })

  it('não duplica nome e detalhe (ignorando maiúsculas)', async () => {
    const ctx = await start(NOW)
    const response = await create(ctx, { name: 'projetor epson wxga', detail: 'PATRIMÔNIO #24810', totalQuantity: 1 })
    expect(response.status).toBe(409)
  })

  it('só a Coordenação cadastra', async () => {
    const ctx = await start(NOW)
    const body = { name: 'Mouse', totalQuantity: 2 }
    expect((await create(ctx, body, ctx.staff)).status).toBe(403)
    expect((await create(ctx, body, ctx.professor)).status).toBe(403)
  })
})

describe('PATCH /admin/materiais/:id', () => {
  it('altera nome, detalhe e quantidade', async () => {
    const ctx = await start(NOW)
    const response = await patch(ctx, 'mat-hdmi', { name: 'Cabo HDMI 2.1', detail: '2 metros', totalQuantity: 10 })
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ name: 'Cabo HDMI 2.1', detail: '2 metros', totalQuantity: 10 })

    // Texto vazio limpa o detalhe.
    expect((await patch(ctx, 'mat-hdmi', { detail: '' })).body.detail).toBeNull()
  })

  it('não deixa a quantidade ficar abaixo da já comprometida', async () => {
    const ctx = await start(NOW)
    const abaixo = await patch(ctx, 'mat-notebook', { totalQuantity: 1 })
    expect(abaixo.status).toBe(409)
    expect(abaixo.body.message).toContain('(2)')
    expect((await patch(ctx, 'mat-notebook', { totalQuantity: 2 })).status).toBe(200)
  })

  it('não inativa material aprovado ou em posse', async () => {
    const ctx = await start(NOW)
    const response = await patch(ctx, 'mat-projetor', { active: false }) // item-004 está em posse
    expect(response.status).toBe(409)
    expect(response.body.message).toContain('Aguarde a devolução')
  })

  it('inativa o que não está em uso: some das opções e não pode ser pedido; dá para reativar', async () => {
    const ctx = await start(NOW)
    const novo = await create(ctx, { name: 'Mesa digitalizadora', totalQuantity: 3 })
    const id = novo.body.id as string

    expect((await patch(ctx, id, { active: false })).body.active).toBe(false)
    const opcoes = await options(ctx)
    expect(opcoes.body.materials.map((item: { value: string }) => item.value)).not.toContain(id)

    const pedido = await request(ctx.app)
      .post('/solicitacoes')
      .set('Authorization', ctx.professor)
      .send({ date: '2026-10-08', room: 'j-204', pickupTime: '09:00', returnTime: '11:00', items: [{ id }] })
    expect(pedido.status).toBe(400)

    expect((await patch(ctx, id, { active: true })).body.active).toBe(true)
    expect((await options(ctx)).body.materials.map((item: { value: string }) => item.value)).toContain(id)
  })

  it('valida o corpo e os ids', async () => {
    const ctx = await start(NOW)
    expect((await patch(ctx, 'mat-hdmi', {})).status).toBe(400)
    expect((await patch(ctx, 'mat-hdmi', { active: 'sim' })).status).toBe(400)
    expect((await patch(ctx, 'mat-999', { name: 'Qualquer' })).status).toBe(404)
  })

  it('não existe rota para remover material', async () => {
    const ctx = await start(NOW)
    const response = await request(ctx.app).delete('/admin/materiais/mat-hdmi').set('Authorization', ctx.coord)
    expect(response.status).toBe(404)
    const lista = await request(ctx.app).get('/admin/materiais').set('Authorization', ctx.coord)
    expect(lista.body).toHaveLength(4)
  })
})

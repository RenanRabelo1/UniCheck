import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { start } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())

const NOW = '2026-10-05T12:00:00-03:00'
type Ctx = Awaited<ReturnType<typeof start>>

const create = (ctx: Ctx, body: object, token = ctx.coord) =>
  request(ctx.app).post('/admin/materiais').set('Authorization', token).send(body)
const patch = (ctx: Ctx, id: string, body: object, token = ctx.coord) =>
  request(ctx.app).patch(`/admin/materiais/${id}`).set('Authorization', token).send(body)
const options = (ctx: Ctx) => request(ctx.app).get('/solicitacoes/opcoes').set('Authorization', ctx.professor)

describe('controle individual ou por quantidade (RF20.5 a RF20.10)', () => {
  const individual = { name: 'Projetor BenQ', category: 'Projetor', control: 'individual', patrimony: 'PAT-1', totalQuantity: 1 }

  it('cadastra material individual com categoria e patrimônio', async () => {
    const ctx = await start(NOW)
    const response = await create(ctx, individual)
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      category: 'Projetor',
      control: 'individual',
      patrimony: 'PAT-1',
      totalQuantity: 1,
      inPossession: 0,
    })
  })

  it('sem controle informado continua por quantidade', async () => {
    const ctx = await start(NOW)
    const response = await create(ctx, { name: 'Pincel', totalQuantity: 5 })
    expect(response.body).toMatchObject({ category: 'Geral', control: 'quantity', patrimony: null })
  })

  it('dois individuais com o mesmo nome e patrimônios diferentes são materiais distintos', async () => {
    const ctx = await start(NOW)
    expect((await create(ctx, individual)).status).toBe(201)
    expect((await create(ctx, { ...individual, patrimony: 'PAT-2' })).status).toBe(201)
  })

  it('patrimônio é único', async () => {
    const ctx = await start(NOW)
    await create(ctx, individual)
    const repetido = await create(ctx, { ...individual, name: 'Outro projetor' })
    expect(repetido.status).toBe(409)
    expect(repetido.body.message).toContain('patrimônio')
  })

  it.each([
    ['individual sem patrimônio', { ...individual, patrimony: undefined }],
    ['individual com mais de uma unidade', { ...individual, totalQuantity: 2 }],
    ['por quantidade com patrimônio', { name: 'Pincel', control: 'quantity', patrimony: 'X', totalQuantity: 2 }],
  ])('rejeita %s', async (_nome, body) => {
    const ctx = await start(NOW)
    expect((await create(ctx, body)).status).toBe(400)
  })

  it('edita categoria e patrimônio, sem deixar o individual virar lote', async () => {
    const ctx = await start(NOW)
    const { body } = await create(ctx, individual)

    const editado = await patch(ctx, body.id, { category: 'Audiovisual', patrimony: 'PAT-9' })
    expect(editado.body).toMatchObject({ category: 'Audiovisual', patrimony: 'PAT-9' })
    expect((await patch(ctx, body.id, { totalQuantity: 3 })).status).toBe(400)
    expect((await patch(ctx, body.id, { patrimony: '' })).status).toBe(400)
    expect((await patch(ctx, '1002', { patrimony: 'PAT-3' })).status).toBe(400)
  })

  it('informa quantas unidades estão em posse agora', async () => {
    const ctx = await start(NOW)
    const { body } = await request(ctx.app).get('/admin/materiais').set('Authorization', ctx.coord)
    const emPosse = (id: string) => body.find((item: { id: string }) => item.id === id).inPossession
    expect(emPosse('1001')).toBe(1) // item 1004 retirado
    expect(emPosse('1004')).toBe(0)
  })

  it('o professor vê o patrimônio do material individual nas opções', async () => {
    const ctx = await start(NOW)
    const { body } = await create(ctx, individual)
    const opcoes = await options(ctx)
    expect(opcoes.body.items).toContainEqual(
      expect.objectContaining({ id: body.id, detail: 'Patrimônio PAT-1', total: 1 }),
    )
  })
})

describe('GET /admin/materiais', () => {
  it('lista o cadastro com a quantidade já comprometida', async () => {
    const ctx = await start(NOW)
    const response = await request(ctx.app).get('/admin/materiais').set('Authorization', ctx.coord)
    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(4)
    // Notebook: 1001 (aprovado, 06/10) + 1005 (em posse hoje) = 2 comprometidos.
    expect(response.body.find((item: { id: string }) => item.id === '1002')).toMatchObject({
      totalQuantity: 6,
      committed: 2,
      active: true,
    })
  })

  it('a Secretaria consulta, mas professor não', async () => {
    const ctx = await start(NOW)
    expect((await request(ctx.app).get('/admin/materiais').set('Authorization', ctx.coord)).status).toBe(200)
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
    expect(opcoes.body.items).toContainEqual(
      expect.objectContaining({
        type: 'material',
        id: response.body.id,
        name: 'Mesa digitalizadora',
        detail: 'Patrimônio #30001',
        available: 3,
      }),
    )
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
    expect((await create(ctx, body, ctx.aluno)).status).toBe(403)
    expect((await create(ctx, body, ctx.professor)).status).toBe(403)
  })
})

describe('PATCH /admin/materiais/:id', () => {
  it('altera nome, detalhe e quantidade', async () => {
    const ctx = await start(NOW)
    const response = await patch(ctx, '1003', { name: 'Cabo HDMI 2.1', detail: '2 metros', totalQuantity: 10 })
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ name: 'Cabo HDMI 2.1', detail: '2 metros', totalQuantity: 10 })

    // Texto vazio limpa o detalhe.
    expect((await patch(ctx, '1003', { detail: '' })).body.detail).toBeNull()
  })

  it('não deixa a quantidade ficar abaixo da já comprometida', async () => {
    const ctx = await start(NOW)
    const abaixo = await patch(ctx, '1002', { totalQuantity: 1 })
    expect(abaixo.status).toBe(409)
    expect(abaixo.body.message).toContain('(2)')
    expect((await patch(ctx, '1002', { totalQuantity: 2 })).status).toBe(200)
  })

  it('não inativa material aprovado ou em posse', async () => {
    const ctx = await start(NOW)
    const response = await patch(ctx, '1001', { active: false }) // 1004 está em posse
    expect(response.status).toBe(409)
    expect(response.body.message).toContain('Aguarde a devolução')
  })

  it('inativa o que não está em uso: some das opções e não pode ser pedido; dá para reativar', async () => {
    const ctx = await start(NOW)
    const novo = await create(ctx, { name: 'Mesa digitalizadora', totalQuantity: 3 })
    const id = novo.body.id as string

    expect((await patch(ctx, id, { active: false })).body.active).toBe(false)
    const opcoes = await options(ctx)
    expect(opcoes.body.items.map((item: { id: string }) => item.id)).not.toContain(id)

    const pedido = await request(ctx.app)
      .post('/solicitacoes')
      .set('Authorization', ctx.professor)
      .send({ date: '2026-10-08', room: '1002', pickupTime: '09:00', returnTime: '11:00', items: [{ type: 'material', id }] })
    expect(pedido.status).toBe(400)

    expect((await patch(ctx, id, { active: true })).body.active).toBe(true)
    expect((await options(ctx)).body.items.map((item: { id: string }) => item.id)).toContain(id)
  })

  it('valida o corpo e os ids', async () => {
    const ctx = await start(NOW)
    expect((await patch(ctx, '1003', {})).status).toBe(400)
    expect((await patch(ctx, '1003', { active: 'sim' })).status).toBe(400)
    expect((await patch(ctx, '9999', { name: 'Qualquer' })).status).toBe(404)
  })

  it('não existe rota para remover material', async () => {
    const ctx = await start(NOW)
    const response = await request(ctx.app).delete('/admin/materiais/1003').set('Authorization', ctx.coord)
    expect(response.status).toBe(404)
    const lista = await request(ctx.app).get('/admin/materiais').set('Authorization', ctx.coord)
    expect(lista.body).toHaveLength(4)
  })
})

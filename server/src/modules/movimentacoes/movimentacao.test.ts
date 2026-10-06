import request from 'supertest'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { start } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())
afterAll(() => {
  delete process.env.DATA_FILE
})

// 06/10 de manhã: o dia de utilização da solicitação sol-001 (itens já aprovados).
const DIA_DA_RETIRADA = '2026-10-06T08:30:00-03:00'

const retirada = { requestId: 'sol-001', itemId: 'item-001', termAccepted: true }

describe('POST /movimentacoes/retiradas', () => {
  it('registra a retirada, muda o item para "em posse" e guarda o responsável', async () => {
    const ctx = await start(DIA_DA_RETIRADA)
    const response = await request(ctx.app).post('/movimentacoes/retiradas').set('Authorization', ctx.staff).send(retirada)

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      type: 'withdrawal',
      itemName: 'Notebook Dell Latitude + carregador',
      responsible: 'Prof. Ricardo Mendes',
      registeredBy: 'Marcos Oliveira',
    })

    const visto = await request(ctx.app).get('/solicitacoes/sol-001').set('Authorization', ctx.professor)
    expect(visto.body.items[0]).toMatchObject({ status: 'RETIRADO', statusLabel: 'Em posse' })
  })

  it('aceita informar quem retirou e uma observação', async () => {
    const ctx = await start(DIA_DA_RETIRADA)
    const response = await request(ctx.app)
      .post('/movimentacoes/retiradas')
      .set('Authorization', ctx.staff)
      .send({ ...retirada, responsibleName: 'Ana Souza (monitora)', notes: 'Retirou com a autorização do professor.' })
    expect(response.body).toMatchObject({ responsible: 'Ana Souza (monitora)', notes: 'Retirou com a autorização do professor.' })
  })

  it('exige o aceite do termo de responsabilidade', async () => {
    const ctx = await start(DIA_DA_RETIRADA)
    const response = await request(ctx.app)
      .post('/movimentacoes/retiradas')
      .set('Authorization', ctx.staff)
      .send({ requestId: 'sol-001', itemId: 'item-001', termAccepted: false })
    expect(response.status).toBe(400)
    expect(response.body.message).toBe('É necessário o aceite do termo de responsabilidade.')
  })

  it('só retira no dia de utilização', async () => {
    const ctx = await start('2026-10-05T12:00:00-03:00')
    const response = await request(ctx.app).post('/movimentacoes/retiradas').set('Authorization', ctx.staff).send(retirada)
    expect(response.status).toBe(409)
  })

  it('não retira item que ainda está pendente nem item inexistente', async () => {
    const ctx = await start('2026-10-07T09:00:00-03:00')
    const pendente = await request(ctx.app)
      .post('/movimentacoes/retiradas')
      .set('Authorization', ctx.staff)
      .send({ requestId: 'sol-002', itemId: 'item-003', termAccepted: true })
    expect(pendente.status).toBe(409)

    const inexistente = await request(ctx.app)
      .post('/movimentacoes/retiradas')
      .set('Authorization', ctx.staff)
      .send({ requestId: 'sol-001', itemId: 'item-999', termAccepted: true })
    expect(inexistente.status).toBe(404)
  })

  it('professor e aluno não registram retirada', async () => {
    const ctx = await start(DIA_DA_RETIRADA)
    for (const token of [ctx.professor, ctx.aluno]) {
      expect((await request(ctx.app).post('/movimentacoes/retiradas').set('Authorization', token).send(retirada)).status).toBe(403)
    }
  })
})

describe('POST /movimentacoes/devolucoes', () => {
  it('registra a devolução e não deixa devolver duas vezes', async () => {
    const ctx = await start('2026-10-05T17:00:00-03:00')
    const body = { requestId: 'sol-003', itemId: 'item-004' }

    const response = await request(ctx.app).post('/movimentacoes/devolucoes').set('Authorization', ctx.staff).send(body)
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({ type: 'return', itemName: 'Projetor Epson WXGA', wasLate: false })

    const visto = await request(ctx.app).get('/solicitacoes/sol-003').set('Authorization', ctx.professor)
    expect(visto.body.items[0].status).toBe('DEVOLVIDO')

    expect((await request(ctx.app).post('/movimentacoes/devolucoes').set('Authorization', ctx.staff).send(body)).status).toBe(409)
  })

  it('não devolve item que nunca foi retirado', async () => {
    const ctx = await start(DIA_DA_RETIRADA)
    const response = await request(ctx.app)
      .post('/movimentacoes/devolucoes')
      .set('Authorization', ctx.staff)
      .send({ requestId: 'sol-001', itemId: 'item-001' })
    expect(response.status).toBe(409)
  })
})

describe('GET /movimentacoes', () => {
  it('devolve o histórico, filtrável por solicitação', async () => {
    const ctx = await start(DIA_DA_RETIRADA)
    const response = await request(ctx.app).get('/movimentacoes?requestId=sol-003').set('Authorization', ctx.coord)
    expect(response.status).toBe(200)
    expect(response.body).toHaveLength(3)
    expect(response.body.every((item: { type: string }) => item.type === 'withdrawal')).toBe(true)
  })

  it('é restrito à Secretaria e à Coordenação', async () => {
    const ctx = await start(DIA_DA_RETIRADA)
    expect((await request(ctx.app).get('/movimentacoes').set('Authorization', ctx.professor)).status).toBe(403)
    expect((await request(ctx.app).get('/movimentacoes')).status).toBe(401)
  })
})

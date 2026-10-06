import request from 'supertest'
import { afterEach, afterAll, describe, expect, it, vi } from 'vitest'
import { start } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())
afterAll(() => {
  delete process.env.DATA_FILE
})

const NOW = '2026-10-05T12:00:00-03:00'

function decide(ctx: Awaited<ReturnType<typeof start>>, token: string, requestId: string, itemId: string, body: object) {
  return request(ctx.app).post(`/admin/solicitacoes/${requestId}/itens/${itemId}/decisao`).set('Authorization', token).send(body)
}

describe('GET /admin/solicitacoes', () => {
  it('lista a fila de pendentes com o solicitante', async () => {
    const ctx = await start(NOW)
    const response = await request(ctx.app).get('/admin/solicitacoes?status=PENDENTE').set('Authorization', ctx.coord)
    expect(response.status).toBe(200)
    expect(response.body.map((item: { id: string }) => item.id)).toEqual(['sol-002', 'sol-007'])
    expect(response.body[0].requester).toMatchObject({ name: 'Prof. Ricardo Mendes', role: 'professor' })
  })

  it('a Secretaria também consulta, mas professor não', async () => {
    const ctx = await start(NOW)
    expect((await request(ctx.app).get('/admin/solicitacoes').set('Authorization', ctx.staff)).status).toBe(200)
    expect((await request(ctx.app).get('/admin/solicitacoes').set('Authorization', ctx.professor)).status).toBe(403)
  })

  it('filtra por data e valida o status', async () => {
    const ctx = await start(NOW)
    const byDate = await request(ctx.app).get('/admin/solicitacoes?date=2026-10-07').set('Authorization', ctx.coord)
    expect(byDate.body.map((item: { id: string }) => item.id)).toEqual(['sol-002'])
    const invalid = await request(ctx.app).get('/admin/solicitacoes?status=XYZ').set('Authorization', ctx.coord)
    expect(invalid.status).toBe(400)
  })
})

describe('POST /admin/solicitacoes/:id/itens/:itemId/decisao', () => {
  it('aprova um item pendente e registra quem decidiu', async () => {
    const ctx = await start(NOW)
    const response = await decide(ctx, ctx.coord, 'sol-002', 'item-003', { decision: 'approve' })
    expect(response.status).toBe(200)
    expect(response.body.items[0]).toMatchObject({ status: 'APROVADO', statusLabel: 'Aprovado' })

    // Decidir de novo o mesmo item não é permitido.
    expect((await decide(ctx, ctx.coord, 'sol-002', 'item-003', { decision: 'approve' })).status).toBe(409)
  })

  it('exige motivo para recusar e mostra o motivo ao solicitante', async () => {
    const ctx = await start(NOW)
    const semMotivo = await decide(ctx, ctx.coord, 'sol-002', 'item-003', { decision: 'refuse' })
    expect(semMotivo.status).toBe(400)
    expect(semMotivo.body.message).toBe('Toda recusa precisa de motivo.')

    const recusa = await decide(ctx, ctx.coord, 'sol-002', 'item-003', { decision: 'refuse', reason: 'Kit em manutenção.' })
    expect(recusa.status).toBe(200)

    const visto = await request(ctx.app).get('/solicitacoes/sol-002').set('Authorization', ctx.professor)
    expect(visto.body.items[0]).toMatchObject({ status: 'RECUSADO', refusalReason: 'Kit em manutenção.' })
  })

  it('só a Coordenação decide', async () => {
    const ctx = await start(NOW)
    expect((await decide(ctx, ctx.staff, 'sol-002', 'item-003', { decision: 'approve' })).status).toBe(403)
    expect((await decide(ctx, ctx.professor, 'sol-002', 'item-003', { decision: 'approve' })).status).toBe(403)
  })

  it('responde 404 para solicitação ou item inexistente e 400 para decisão inválida', async () => {
    const ctx = await start(NOW)
    expect((await decide(ctx, ctx.coord, 'sol-999', 'item-003', { decision: 'approve' })).status).toBe(404)
    expect((await decide(ctx, ctx.coord, 'sol-002', 'item-999', { decision: 'approve' })).status).toBe(404)
    expect((await decide(ctx, ctx.coord, 'sol-002', 'item-003', { decision: 'talvez' })).status).toBe(400)
  })

  // O cenário que justifica reconferir na aprovação: pedido pendente não segura estoque.
  async function doisPedidosDoMesmoProjetor(ctx: Awaited<ReturnType<typeof start>>) {
    const body = { date: '2026-10-09', room: 'j-201', pickupTime: '09:00', returnTime: '11:00', items: [{ id: 'mat-projetor' }] }
    const first = await request(ctx.app).post('/solicitacoes').set('Authorization', ctx.professor).send(body)
    const second = await request(ctx.app).post('/solicitacoes').set('Authorization', ctx.professor).send(body)
    expect([first.status, second.status]).toEqual([201, 201])
    return [first.body, second.body] as const
  }

  it('não aprova o segundo pedido do mesmo item na mesma janela', async () => {
    const ctx = await start(NOW)
    const [first, second] = await doisPedidosDoMesmoProjetor(ctx)

    expect((await decide(ctx, ctx.coord, first.id, first.items[0].id, { decision: 'approve' })).status).toBe(200)
    const conflito = await decide(ctx, ctx.coord, second.id, second.items[0].id, { decision: 'approve' })
    expect(conflito.status).toBe(409)
    expect(conflito.body.message).toContain('não tem unidades suficientes')
  })

  it('com duas aprovações simultâneas, só uma passa', async () => {
    const ctx = await start(NOW)
    const [first, second] = await doisPedidosDoMesmoProjetor(ctx)

    const responses = await Promise.all([
      decide(ctx, ctx.coord, first.id, first.items[0].id, { decision: 'approve' }),
      decide(ctx, ctx.coord, second.id, second.items[0].id, { decision: 'approve' }),
    ])
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409])
  })
})

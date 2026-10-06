import request from 'supertest'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import { fixNow, start } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())
afterAll(() => {
  delete process.env.DATA_FILE
})

const verificar = (ctx: Awaited<ReturnType<typeof start>>, token = ctx.coord) =>
  request(ctx.app).post('/alertas/verificar').set('Authorization', token)

describe('verificação de atrasos (22:40)', () => {
  it('antes das 22:40 não gera alerta', async () => {
    const ctx = await start('2026-10-05T22:30:00-03:00')
    const response = await verificar(ctx)
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ created: 0 })
  })

  it('depois das 22:40 marca os itens em posse como atrasados, uma única vez', async () => {
    const ctx = await start('2026-10-05T22:41:00-03:00')

    expect((await verificar(ctx)).body).toEqual({ created: 4 }) // item-004, 005, 006 e 008
    expect((await verificar(ctx)).body).toEqual({ created: 0 }) // repetir não duplica

    const alertas = await request(ctx.app).get('/alertas').set('Authorization', ctx.staff)
    expect(alertas.status).toBe(200)
    expect(alertas.body).toHaveLength(4)
    expect(alertas.body[0]).toMatchObject({ status: 'open', resolvedAt: null })

    // O painel do professor passa a mostrar "Em atraso" e continua contando como em posse.
    const painel = await request(ctx.app).get('/dashboard').set('Authorization', ctx.professor)
    expect(painel.body.summary.inPossession).toBe(3)
    expect(painel.body.recentActivity.some((item: { status: string }) => item.status === 'Em atraso')).toBe(true)
  })

  it('devolver o item resolve o alerta dele', async () => {
    const ctx = await start('2026-10-05T22:41:00-03:00')
    await verificar(ctx)

    const devolucao = await request(ctx.app)
      .post('/movimentacoes/devolucoes')
      .set('Authorization', ctx.staff)
      .send({ requestId: 'sol-003', itemId: 'item-004' })
    expect(devolucao.body.wasLate).toBe(true)

    const abertos = await request(ctx.app).get('/alertas').set('Authorization', ctx.staff)
    expect(abertos.body).toHaveLength(3)
    const resolvidos = await request(ctx.app).get('/alertas?status=resolved').set('Authorization', ctx.staff)
    expect(resolvidos.body).toHaveLength(1)
    expect(resolvidos.body[0]).toMatchObject({ itemName: 'Projetor Epson WXGA', status: 'resolved' })
  })

  it('considera atrasado o item de um dia anterior, mesmo de manhã', async () => {
    const ctx = await start('2026-10-05T23:30:00-03:00')
    fixNow('2026-10-06T07:00:00-03:00') // já é o dia seguinte; o token (8h) ainda vale
    const response = await verificar(ctx)
    expect(response.body).toEqual({ created: 4 })
  })

  it('só a Coordenação dispara a verificação; a lista é restrita', async () => {
    const ctx = await start('2026-10-05T22:41:00-03:00')
    expect((await verificar(ctx, ctx.staff)).status).toBe(403)
    expect((await request(ctx.app).get('/alertas').set('Authorization', ctx.professor)).status).toBe(403)
    expect((await request(ctx.app).get('/alertas?status=xyz').set('Authorization', ctx.coord)).status).toBe(400)
  })
})

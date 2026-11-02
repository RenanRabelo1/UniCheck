import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fixNow, start } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())

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

    expect((await verificar(ctx)).body).toEqual({ created: 4 }) // 1004, 005, 006 e 008
    expect((await verificar(ctx)).body).toEqual({ created: 0 }) // repetir não duplica

    const alertas = await request(ctx.app).get('/alertas').set('Authorization', ctx.coord)
    expect(alertas.status).toBe(200)
    expect(alertas.body).toHaveLength(4)
    expect(alertas.body[0]).toMatchObject({ status: 'open', resolvedAt: null })

    // O painel do professor passa a mostrar "Em atraso" e continua contando como em posse.
    const painel = await request(ctx.app).get('/dashboard').set('Authorization', ctx.professor)
    expect(painel.body.summary.inPossession).toBe(3)
    expect(painel.body.recentActivity.some((item: { status: string }) => item.status === 'Em atraso')).toBe(true)
  })

  it('o alerta traz responsável, item, sala da chave e horários (RF19.5 a RF19.12)', async () => {
    const ctx = await start('2026-10-05T22:41:00-03:00')
    await verificar(ctx)

    const { body } = await request(ctx.app).get('/alertas').set('Authorization', ctx.coord)
    const chave = body.find((alerta: { itemId: string }) => alerta.itemId === '1008')
    expect(chave).toMatchObject({
      protocol: 'CCT-2026-01005',
      requester: 'Lucas Almeida',
      registration: '2412001',
      contact: null,
      itemType: 'key',
      room: 'J-201',
      keyType: 'Primária',
      dueDate: '2026-10-05',
      dueTime: '18:00',
    })
    expect(chave.withdrawnAt).toContain('2026-10-05T10:20')

    const material = body.find((alerta: { itemId: string }) => alerta.itemId === '1004')
    expect(material).toMatchObject({ itemType: 'material', room: null, keyType: null })
  })

  it('devolver o item resolve o alerta dele', async () => {
    const ctx = await start('2026-10-05T22:41:00-03:00')
    await verificar(ctx)

    const devolucao = await request(ctx.app)
      .post('/movimentacoes/devolucoes')
      .set('Authorization', ctx.coord)
      .send({ requestId: '1003', itemId: '1004' })
    expect(devolucao.body.wasLate).toBe(true)

    const abertos = await request(ctx.app).get('/alertas').set('Authorization', ctx.coord)
    expect(abertos.body).toHaveLength(3)
    const resolvidos = await request(ctx.app).get('/alertas?status=resolved').set('Authorization', ctx.coord)
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
    expect((await verificar(ctx, ctx.professor)).status).toBe(403)
    expect((await request(ctx.app).get('/alertas').set('Authorization', ctx.professor)).status).toBe(403)
    expect((await request(ctx.app).get('/alertas?status=xyz').set('Authorization', ctx.coord)).status).toBe(400)
  })
})

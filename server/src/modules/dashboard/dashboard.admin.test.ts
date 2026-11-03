import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fixNow, start } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())

type Ctx = Awaited<ReturnType<typeof start>>
const painel = (ctx: Ctx, token = ctx.coord) => request(ctx.app).get('/dashboard/admin').set('Authorization', token)

describe('GET /dashboard/admin', () => {
  it('conta os itens por etapa do fluxo (RF12.4 a RF12.7)', async () => {
    const ctx = await start('2026-10-05T12:00:00-03:00')
    const { status, body } = await painel(ctx)
    expect(status).toBe(200)
    expect(body.summary).toEqual({
      pendingItems: 2,
      approvedItems: 2,
      withdrawnItems: 4,
      pendingReturns: 0,
      openAlerts: 0,
    })
  })

  it('devolução pendente é item em posse com o prazo vencido', async () => {
    const ctx = await start('2026-10-05T17:30:00-03:00')
    expect((await painel(ctx)).body.summary.pendingReturns).toBe(3) // prazo 17:00; a chave vence às 18:00
    fixNow('2026-10-05T18:30:00-03:00')
    expect((await painel(ctx)).body.summary.pendingReturns).toBe(4)
  })

  it('conta os alertas abertos e desconta o item devolvido (RF19.4)', async () => {
    const ctx = await start('2026-10-05T22:41:00-03:00')
    await request(ctx.app).post('/alertas/verificar').set('Authorization', ctx.coord)
    expect((await painel(ctx)).body.summary).toMatchObject({ withdrawnItems: 4, pendingReturns: 4, openAlerts: 4 })

    await request(ctx.app)
      .post('/movimentacoes/devolucoes')
      .set('Authorization', ctx.coord)
      .send({ requestId: '1003', itemId: '1004', condition: 'INTEGRO' })
    expect((await painel(ctx)).body.summary).toMatchObject({ withdrawnItems: 3, pendingReturns: 3, openAlerts: 3 })
  })

  it('lista as cinco solicitações mais recentes com o solicitante', async () => {
    const ctx = await start('2026-10-05T12:00:00-03:00')
    const { recentRequests } = (await painel(ctx)).body

    expect(recentRequests.map((item: { protocol: string }) => item.protocol)).toEqual([
      'CCT-2026-01002',
      'CCT-2026-01001',
      'CCT-2026-01007',
      'CCT-2026-01005',
      'CCT-2026-01003',
    ])
    expect(recentRequests[1]).toMatchObject({
      id: '1001',
      requester: 'Prof. Ricardo Mendes',
      requesterRole: 'Professor',
      items: ['Notebook Dell Latitude + carregador', 'Cabo HDMI 2.0'],
      date: '2026-10-06',
      pickupTime: '08:00',
      returnTime: '12:00',
      statusLabel: 'Aprovada',
    })
    expect(recentRequests[0].statusLabel).toBe('Pendente')
    expect(recentRequests[3].statusLabel).toBe('Em posse')
  })

  it('a situação da solicitação destaca o que ainda exige ação e o fim do ciclo', async () => {
    const ctx = await start('2026-10-05T22:41:00-03:00')
    await request(ctx.app).post('/alertas/verificar').set('Authorization', ctx.coord)
    const atrasada = (await painel(ctx)).body.recentRequests.find((item: { id: string }) => item.id === '1005')
    expect(atrasada.statusLabel).toBe('Em atraso')

    await request(ctx.app)
      .post('/movimentacoes/devolucoes')
      .set('Authorization', ctx.coord)
      .send({ requestId: '1005', itemId: '1008', condition: 'INTEGRO' })
    const finalizada = (await painel(ctx)).body.recentRequests.find((item: { id: string }) => item.id === '1005')
    expect(finalizada.statusLabel).toBe('Finalizada')
  })

  it('é restrito à Coordenação e à Secretaria', async () => {
    const ctx = await start('2026-10-05T12:00:00-03:00')
    expect((await painel(ctx, ctx.professor)).status).toBe(403)
    expect((await painel(ctx, ctx.aluno)).status).toBe(403)
    expect((await request(ctx.app).get('/dashboard/admin')).status).toBe(401)
  })
})

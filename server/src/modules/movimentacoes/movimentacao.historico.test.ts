import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { start } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())

const NOW = '2026-10-05T12:00:00-03:00'
type Ctx = Awaited<ReturnType<typeof start>>

const historico = (ctx: Ctx, query = '', token = ctx.coord) =>
  request(ctx.app).get(`/movimentacoes/historico${query}`).set('Authorization', token)
const itens = (body: { itemId: string }[]) => body.map((item) => item.itemId).sort()

describe('GET /movimentacoes/historico', () => {
  it('traz um registro por item, inclusive os que nunca foram movimentados', async () => {
    const ctx = await start(NOW)
    const { status, body } = await historico(ctx)
    expect(status).toBe(200)
    expect(body).toHaveLength(10)

    const pendente = body.find((item: { itemId: string }) => item.itemId === '1003')
    expect(pendente).toMatchObject({ status: 'PENDENTE', decision: null, withdrawal: null, return: null, wasLate: false })
  })

  it('reúne quem decidiu, entregou e recebeu, com datas e observações', async () => {
    const ctx = await start(NOW)
    const { body } = await historico(ctx)
    const item = body.find((linha: { itemId: string }) => linha.itemId === '1007')

    expect(item).toMatchObject({
      requestId: '1004',
      protocol: 'CCT-2026-01004',
      requester: 'Prof. Ricardo Mendes',
      registration: '2048819',
      itemName: 'Kit Arduino e Sensores IoT',
      itemType: 'material',
      room: 'J-311',
      status: 'DEVOLVIDO',
      statusLabel: 'Devolvido',
      decision: { by: 'Coordenação CCT', outcome: 'approved', reason: null },
      withdrawal: { by: 'Coordenação CCT', responsible: 'Prof. Ricardo Mendes', notes: null },
      return: { by: 'Coordenação CCT', responsible: 'Prof. Ricardo Mendes', notes: null },
    })
    expect(item.decision.at).toContain('2026-10-02T17:45')
    expect(item.withdrawal.at).toContain('2026-10-02T13:05')
    expect(item.return.at).toContain('2026-10-02T17:45')
  })

  it('mostra o motivo da recusa e quem recusou', async () => {
    const ctx = await start(NOW)
    await request(ctx.app)
      .post('/admin/solicitacoes/1002/itens/1003/decisao')
      .set('Authorization', ctx.coord)
      .send({ decision: 'refuse', reason: 'Kit em manutenção.' })

    const { body } = await historico(ctx, '?status=RECUSADO')
    expect(body).toHaveLength(1)
    expect(body[0].decision).toMatchObject({ by: 'Coordenação CCT', outcome: 'refused', reason: 'Kit em manutenção.' })
  })

  it('pesquisa por nome, matrícula, protocolo ou item', async () => {
    const ctx = await start(NOW)
    expect(itens((await historico(ctx, '?search=lucas')).body)).toEqual(['1008', '1009', '1010'])
    expect(itens((await historico(ctx, '?search=2412001')).body)).toEqual(['1008', '1009', '1010'])
    expect(itens((await historico(ctx, '?search=CCT-2026-01004')).body)).toEqual(['1007'])
    expect(itens((await historico(ctx, '?search=projetor')).body)).toEqual(['1004'])
  })

  it('a pesquisa trata % e _ como texto, não como curinga', async () => {
    const ctx = await start(NOW)
    expect((await historico(ctx, '?search=%25')).body).toEqual([])
    expect((await historico(ctx, '?search=_')).body).toEqual([])
  })

  it('filtra por status, material, sala e período, e combina os filtros', async () => {
    const ctx = await start(NOW)
    expect(itens((await historico(ctx, '?status=DEVOLVIDO')).body)).toEqual(['1007', '1009'])
    expect(itens((await historico(ctx, '?material=arduino')).body)).toEqual(['1003', '1007'])
    expect(itens((await historico(ctx, '?room=J-311')).body)).toEqual(['1007', '1010'])
    expect(itens((await historico(ctx, '?from=2026-10-05&to=2026-10-05')).body)).toEqual(['1004', '1005', '1006', '1008'])
    expect(itens((await historico(ctx, '?from=2026-10-05&to=2026-10-05&status=RETIRADO&material=chave')).body)).toEqual(['1008'])
  })

  it('marca o item que teve atraso e mantém a marca depois da devolução', async () => {
    const ctx = await start('2026-10-05T22:41:00-03:00')
    await request(ctx.app).post('/alertas/verificar').set('Authorization', ctx.coord)
    await request(ctx.app)
      .post('/movimentacoes/devolucoes')
      .set('Authorization', ctx.coord)
      .send({ requestId: '1003', itemId: '1004' })

    const { body } = await historico(ctx)
    const item = body.find((linha: { itemId: string }) => linha.itemId === '1004')
    expect(item).toMatchObject({ status: 'DEVOLVIDO', wasLate: true })
    expect(body.find((linha: { itemId: string }) => linha.itemId === '1001').wasLate).toBe(false)
  })

  it('preserva o histórico de material inativado', async () => {
    const ctx = await start(NOW)
    await request(ctx.app).patch('/admin/materiais/1004').set('Authorization', ctx.coord).send({ active: false })
    expect(itens((await historico(ctx, '?material=arduino')).body)).toEqual(['1003', '1007'])
  })

  it('valida as datas e restringe o acesso', async () => {
    const ctx = await start(NOW)
    expect((await historico(ctx, '?from=2026-02-31')).status).toBe(400)
    expect((await historico(ctx, '?from=2026-10-06&to=2026-10-01')).status).toBe(400)
    expect((await historico(ctx, '?status=XYZ')).status).toBe(400)
    expect((await historico(ctx, '', ctx.professor)).status).toBe(403)
    expect((await request(ctx.app).get('/movimentacoes/historico')).status).toBe(401)
  })
})

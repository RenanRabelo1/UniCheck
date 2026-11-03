import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { start } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())

// 06/10: dia de utilização do pedido de chave criado em cada teste.
const NOW = '2026-10-06T10:00:00-03:00'
type Ctx = Awaited<ReturnType<typeof start>>

const send = (ctx: Ctx, url: string, body: object, token = ctx.coord) =>
  request(ctx.app).post(url).set('Authorization', token).send(body)

/** Pedido aprovado da chave primária da J-204 (sala que também tem a secundária). */
async function chaveAprovada(ctx: Ctx) {
  const { body } = await send(
    ctx,
    '/solicitacoes',
    {
      date: '2026-10-06',
      room: '1002',
      pickupTime: '14:00',
      returnTime: '16:00',
      items: [{ type: 'key', id: '1002', quantity: 1 }],
    },
    ctx.professor,
  )
  const itemId = body.items[0].id as string
  await send(ctx, `/admin/solicitacoes/${body.id}/itens/${itemId}/decisao`, { decision: 'approve' })
  return { requestId: body.id as string, itemId, termAccepted: true }
}

const noHistorico = async (ctx: Ctx, itemId: string) => {
  const { body } = await request(ctx.app).get('/movimentacoes/historico').set('Authorization', ctx.coord)
  return body.find((linha: { itemId: string }) => linha.itemId === itemId)
}

describe('chave entregue na retirada (RF17, RN25)', () => {
  it('exige identificar a chave entregue', async () => {
    const ctx = await start(NOW)
    const retirada = await send(ctx, '/movimentacoes/retiradas', await chaveAprovada(ctx))
    expect(retirada.status).toBe(400)
    expect(retirada.body.message).toBe('Selecione a chave entregue.')
  })

  it('registra a chave pedida', async () => {
    const ctx = await start(NOW)
    const pedido = await chaveAprovada(ctx)
    expect((await send(ctx, '/movimentacoes/retiradas', { ...pedido, keyId: '1002' })).status).toBe(201)
    expect(await noHistorico(ctx, pedido.itemId)).toMatchObject({ keyDelivered: 'Primária', itemName: 'Chave J-204 · Primária' })
  })

  it('registra outra chave da mesma sala quando for ela a entregue', async () => {
    const ctx = await start(NOW)
    const pedido = await chaveAprovada(ctx)
    expect((await send(ctx, '/movimentacoes/retiradas', { ...pedido, keyId: '1003' })).status).toBe(201)
    expect(await noHistorico(ctx, pedido.itemId)).toMatchObject({ keyDelivered: 'Secundária', itemName: 'Chave J-204 · Secundária' })

    const chaves = await request(ctx.app).get('/admin/chaves').set('Authorization', ctx.coord)
    const emPosse = (id: string) => chaves.body.find((chave: { id: string }) => chave.id === id).inPossession
    expect(emPosse('1003')).toBe(true)
    expect(emPosse('1002')).toBe(false)
  })

  it('recusa chave de outra sala ou inativa', async () => {
    const ctx = await start(NOW)
    const pedido = await chaveAprovada(ctx)
    const outraSala = await send(ctx, '/movimentacoes/retiradas', { ...pedido, keyId: '1004' })
    expect(outraSala.status).toBe(400)
    expect(outraSala.body.message).toBe('Chave não encontrada para esta sala.')

    await request(ctx.app).patch('/admin/chaves/1003').set('Authorization', ctx.coord).send({ active: false })
    expect((await send(ctx, '/movimentacoes/retiradas', { ...pedido, keyId: '1003' })).status).toBe(400)
  })

  it('material não precisa de chave', async () => {
    const ctx = await start(NOW)
    const retirada = await send(ctx, '/movimentacoes/retiradas', { requestId: '1001', itemId: '1001', termAccepted: true })
    expect(retirada.status).toBe(201)
  })
})

describe('condição na devolução', () => {
  const devolucao = { requestId: '1003', itemId: '1004' }

  it('é obrigatória', async () => {
    const ctx = await start(NOW)
    const response = await send(ctx, '/movimentacoes/devolucoes', devolucao)
    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Informe a condição de devolução.')
    expect((await send(ctx, '/movimentacoes/devolucoes', { ...devolucao, condition: 'QUEBRADO' })).status).toBe(400)
  })

  it('fica gravada separada das observações', async () => {
    const ctx = await start(NOW)
    const response = await send(ctx, '/movimentacoes/devolucoes', { ...devolucao, condition: 'AVARIADO', notes: 'Sem cabo' })
    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({ condition: 'Avariado', notes: 'Sem cabo' })
    expect((await noHistorico(ctx, '1004')).return).toMatchObject({ condition: 'Avariado', notes: 'Sem cabo' })
  })
})

describe('decisão vista pelo solicitante (RF11.8)', () => {
  it('mostra quem decidiu cada item e quando', async () => {
    const ctx = await start(NOW)
    const { body } = await request(ctx.app).get('/solicitacoes/1001').set('Authorization', ctx.professor)
    expect(body.items[0]).toMatchObject({ decidedBy: 'Coordenação CCT' })
    expect(body.items[0].decidedAt).toContain('2026-10-05T14:40')

    const pendente = await request(ctx.app).get('/solicitacoes/1002').set('Authorization', ctx.professor)
    expect(pendente.body.items[0]).toMatchObject({ decidedBy: null, decidedAt: null })
  })
})

describe('catálogo do professor', () => {
  it('as opções trazem a categoria do material', async () => {
    const ctx = await start(NOW)
    const { body } = await request(ctx.app).get('/solicitacoes/opcoes').set('Authorization', ctx.professor)
    const material = body.items.find((item: { type: string }) => item.type === 'material')
    expect(material.category).toBe('Geral')
  })
})

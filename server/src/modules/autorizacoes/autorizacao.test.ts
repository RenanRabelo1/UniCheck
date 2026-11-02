import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { start } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())

const NOW = '2026-10-05T12:00:00-03:00'
type Ctx = Awaited<ReturnType<typeof start>>

const get = (ctx: Ctx, url: string, token = ctx.coord) => request(ctx.app).get(url).set('Authorization', token)
const send = (ctx: Ctx, method: 'post' | 'patch', url: string, body: object, token = ctx.coord) =>
  request(ctx.app)[method](url).set('Authorization', token).send(body)
const opcoesDoAluno = (ctx: Ctx, token: string) => get(ctx, '/solicitacoes/opcoes', token)
const chaveBloqueada = (opcoes: { items: { type: string; locked: boolean }[] }) =>
  opcoes.items.filter((item) => item.type === 'key').every((item) => item.locked)
const pedidoDeChave = {
  date: '2026-10-07',
  room: '1002',
  pickupTime: '09:00',
  returnTime: '11:00',
  items: [{ type: 'key', id: '1002', quantity: 1 }],
}

describe('projetos', () => {
  it('lista com professor responsável e situação', async () => {
    const ctx = await start(NOW)
    const { status, body } = await get(ctx, '/admin/projetos')
    expect(status).toBe(200)
    expect(body).toEqual([
      {
        id: '1001',
        name: 'Laboratório de Redes',
        description: null,
        professor: { id: '1001', name: 'Prof. Ricardo Mendes', active: true },
        active: true,
      },
    ])
  })

  it('cria projeto para um professor ativo', async () => {
    const ctx = await start(NOW)
    const criado = await send(ctx, 'post', '/admin/projetos', { name: 'Robótica', description: 'Equipe', professorId: '1001' })
    expect(criado.status).toBe(201)
    expect(criado.body).toMatchObject({ name: 'Robótica', description: 'Equipe', active: true })
    expect((await send(ctx, 'post', '/admin/projetos', { name: 'Robótica', professorId: '1001' })).status).toBe(409)
  })

  it('rejeita projeto sem nome ou com responsável que não é professor', async () => {
    const ctx = await start(NOW)
    expect((await send(ctx, 'post', '/admin/projetos', { professorId: '1001' })).status).toBe(400)
    expect((await send(ctx, 'post', '/admin/projetos', { name: 'Robótica', professorId: '1002' })).status).toBe(400)
    expect((await send(ctx, 'post', '/admin/projetos', { name: 'Robótica', professorId: '9999' })).status).toBe(400)
  })

  it('inativar o projeto bloqueia a chave do aluno; reativar devolve', async () => {
    const ctx = await start(NOW)
    expect((await send(ctx, 'patch', '/admin/projetos/1001', { active: false })).body.active).toBe(false)

    expect(chaveBloqueada((await opcoesDoAluno(ctx, ctx.aluno)).body)).toBe(true)
    const pedido = await send(ctx, 'post', '/solicitacoes', pedidoDeChave, ctx.aluno)
    expect(pedido.status).toBe(403)

    const [autorizacao] = (await get(ctx, '/admin/autorizacoes')).body
    expect(autorizacao).toMatchObject({ active: true, canRequestKey: false })

    await send(ctx, 'patch', '/admin/projetos/1001', { active: true })
    expect(chaveBloqueada((await opcoesDoAluno(ctx, ctx.aluno)).body)).toBe(false)
  })
})

describe('autorizações', () => {
  it('lista aluno, e-mail, projeto, professor, coordenador e datas (RF22.3 a RF22.11)', async () => {
    const ctx = await start(NOW)
    const { body } = await get(ctx, '/admin/autorizacoes')
    expect(body).toEqual([
      {
        id: '1001',
        student: { id: '1002', name: 'Lucas Almeida', email: 'aluno.autorizado@unifor.br', registration: '2412001' },
        project: { id: '1001', name: 'Laboratório de Redes', active: true },
        professor: { id: '1001', name: 'Prof. Ricardo Mendes', active: true },
        coordinator: 'Coordenação CCT',
        authorizedAt: '2026-09-01',
        inactivatedAt: null,
        active: true,
        canRequestKey: true,
      },
    ])
  })

  it('as opções trazem só alunos e professores ativos', async () => {
    const ctx = await start(NOW)
    const { body } = await get(ctx, '/admin/autorizacoes/opcoes')
    expect(body.students.map((aluno: { id: string }) => aluno.id).sort()).toEqual(['1002', '1003'])
    expect(body.professors).toEqual([{ id: '1001', name: 'Prof. Ricardo Mendes', registration: '2048819' }])
  })

  it('autorizar registra o coordenador logado e a data, e libera a chave', async () => {
    const ctx = await start(NOW)
    expect(chaveBloqueada((await opcoesDoAluno(ctx, ctx.alunoSem)).body)).toBe(true)

    const criada = await send(ctx, 'post', '/admin/autorizacoes', { studentId: '1003', projectId: '1001' })
    expect(criada.status).toBe(201)
    expect(criada.body).toMatchObject({ coordinator: 'Coordenação CCT', authorizedAt: '2026-10-05', active: true })

    expect(chaveBloqueada((await opcoesDoAluno(ctx, ctx.alunoSem)).body)).toBe(false)
    expect((await send(ctx, 'post', '/solicitacoes', pedidoDeChave, ctx.alunoSem)).status).toBe(201)
  })

  it('não repete autorização ativa nem aceita aluno ou projeto inválido', async () => {
    const ctx = await start(NOW)
    expect((await send(ctx, 'post', '/admin/autorizacoes', { studentId: '1002', projectId: '1001' })).status).toBe(409)
    expect((await send(ctx, 'post', '/admin/autorizacoes', { studentId: '1001', projectId: '1001' })).status).toBe(400)
    expect((await send(ctx, 'post', '/admin/autorizacoes', { studentId: '1003', projectId: '9999' })).status).toBe(400)

    await send(ctx, 'patch', '/admin/projetos/1001', { active: false })
    expect((await send(ctx, 'post', '/admin/autorizacoes', { studentId: '1003', projectId: '1001' })).status).toBe(409)
  })

  it('inativar registra a data e bloqueia; reativar limpa a data', async () => {
    const ctx = await start(NOW)
    const inativa = await send(ctx, 'patch', '/admin/autorizacoes/1001', { active: false })
    expect(inativa.body).toMatchObject({ active: false, inactivatedAt: '2026-10-05', canRequestKey: false })
    expect(chaveBloqueada((await opcoesDoAluno(ctx, ctx.aluno)).body)).toBe(true)

    const ativa = await send(ctx, 'patch', '/admin/autorizacoes/1001', { active: true })
    expect(ativa.body).toMatchObject({ active: true, inactivatedAt: null, canRequestKey: true })
  })

  it('não reativa autorização de projeto inativo', async () => {
    const ctx = await start(NOW)
    await send(ctx, 'patch', '/admin/autorizacoes/1001', { active: false })
    await send(ctx, 'patch', '/admin/projetos/1001', { active: false })
    expect((await send(ctx, 'patch', '/admin/autorizacoes/1001', { active: true })).status).toBe(409)
  })

  it('não apaga nada: autorização inativa continua listada', async () => {
    const ctx = await start(NOW)
    await send(ctx, 'patch', '/admin/autorizacoes/1001', { active: false })
    expect((await get(ctx, '/admin/autorizacoes')).body).toHaveLength(1)
  })

  it('só a Coordenação altera; aluno e professor não consultam', async () => {
    const ctx = await start(NOW)
    expect((await get(ctx, '/admin/autorizacoes', ctx.professor)).status).toBe(403)
    expect((await get(ctx, '/admin/projetos', ctx.aluno)).status).toBe(403)
    expect((await get(ctx, '/admin/autorizacoes/opcoes', ctx.aluno)).status).toBe(403)
    expect((await send(ctx, 'post', '/admin/autorizacoes', { studentId: '1003', projectId: '1001' }, ctx.professor)).status).toBe(403)
    expect((await send(ctx, 'patch', '/admin/projetos/1001', { active: false }, ctx.aluno)).status).toBe(403)
    expect((await send(ctx, 'patch', '/admin/autorizacoes/404', { active: false })).status).toBe(404)
  })
})

describe('revogar autorização com chave em andamento', () => {
  it('a chave em posse ainda pode ser devolvida', async () => {
    const ctx = await start(NOW)
    await send(ctx, 'patch', '/admin/autorizacoes/1001', { active: false })
    const devolucao = await send(ctx, 'post', '/movimentacoes/devolucoes', { requestId: '1005', itemId: '1008' })
    expect(devolucao.status).toBe(201)
  })

  it('a verificação das 22:40 continua marcando a chave como atrasada', async () => {
    const ctx = await start('2026-10-05T22:41:00-03:00')
    await send(ctx, 'patch', '/admin/projetos/1001', { active: false })
    expect((await send(ctx, 'post', '/alertas/verificar', {})).body).toEqual({ created: 4 })
  })

  it('o pedido pendente não pode mais ser aprovado, mas pode ser recusado', async () => {
    const ctx = await start(NOW)
    await send(ctx, 'patch', '/admin/autorizacoes/1001', { active: false })

    const aprovacao = await send(ctx, 'post', '/admin/solicitacoes/1007/itens/1010/decisao', { decision: 'approve' })
    expect(aprovacao.status).toBe(409)
    expect(aprovacao.body.message).toContain('autorização')

    const recusa = await send(ctx, 'post', '/admin/solicitacoes/1007/itens/1010/decisao', {
      decision: 'refuse',
      reason: 'Autorização revogada.',
    })
    expect(recusa.status).toBe(200)
  })
})

import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestApp, fixNow, tokenOf, type TestApp } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())

// Ids dos dados de demonstração: salas 1001 J-201 · 1002 J-204 · 1003 J-311;
// materiais 1001 projetor · 1002 notebook · 1003 HDMI · 1004 Arduino; chaves 1003 = J-204 secundária.
const SALA_J204 = '1002'
const NOTEBOOK = '1002'
const HDMI = '1003'
const PROJETOR = '1001'
const CHAVE_J204_SECUNDARIA = '1003'

const validBody = {
  date: '2026-10-08',
  room: SALA_J204,
  pickupTime: '09:00',
  returnTime: '11:00',
  notes: 'Aula de redes',
  items: [{ type: 'material', id: NOTEBOOK, quantity: 2 }],
}

type Item = { type: string; id: string; name: string; available: number; locked: boolean; roomId: string | null }

describe('solicitações', () => {
  let app: TestApp
  let professor: string
  let aluno: string
  let alunoSem: string

  beforeEach(async () => {
    fixNow('2026-10-05T12:00:00-03:00') // "hoje" fixo, para os testes não dependerem da data real
    app = await createTestApp()
    professor = await tokenOf(app, '2048819')
    aluno = await tokenOf(app, 'aluno.autorizado@unifor.br')
    alunoSem = await tokenOf(app, 'aluno.naoautorizado@unifor.br')
  })

  describe('GET /solicitacoes/opcoes', () => {
    it('devolve as salas e UMA lista de materiais e chaves, igual para professor e aluno', async () => {
      const doProfessor = await request(app).get('/solicitacoes/opcoes').set('Authorization', professor)
      const doAluno = await request(app).get('/solicitacoes/opcoes').set('Authorization', aluno)

      expect(doProfessor.status).toBe(200)
      expect(doProfessor.body.rooms).toHaveLength(3)
      // 4 materiais + 4 chaves.
      expect(doProfessor.body.items).toHaveLength(8)
      expect(doAluno.body.items).toEqual(doProfessor.body.items)
      expect(doProfessor.body.items.filter((item: Item) => item.type === 'key')).toHaveLength(4)
    })

    it('cada chave sabe a sala dela e as chaves liberadas não vêm bloqueadas', async () => {
      const response = await request(app).get('/solicitacoes/opcoes').set('Authorization', aluno)
      const chaves = response.body.items.filter((item: Item) => item.type === 'key')
      expect(chaves.filter((item: Item) => item.roomId === SALA_J204)).toHaveLength(2)
      expect(chaves.every((item: Item) => !item.locked)).toBe(true)
      expect(response.body.authorization).toEqual({
        project: 'Laboratório de Redes',
        responsibleProfessor: 'Prof. Ricardo Mendes',
      })
    })

    it('aluno sem autorização vê a lista, mas com as chaves bloqueadas', async () => {
      const response = await request(app).get('/solicitacoes/opcoes').set('Authorization', alunoSem)
      expect(response.status).toBe(200)
      const chaves = response.body.items.filter((item: Item) => item.type === 'key')
      expect(chaves.every((item: Item) => item.locked)).toBe(true)
      expect(chaves[0].lockedReason).toBe('Requer autorização ativa para solicitar chaves.')
      expect(response.body.items.filter((item: Item) => item.type === 'material').every((item: Item) => !item.locked)).toBe(true)
      expect(response.body.authorization).toBeNull()
    })

    it('calcula a disponibilidade para a janela pedida', async () => {
      const response = await request(app)
        .get('/solicitacoes/opcoes?date=2026-10-05&pickupTime=10:00&returnTime=12:00')
        .set('Authorization', professor)
      const projetor = response.body.items.find((item: Item) => item.type === 'material' && item.id === PROJETOR)
      expect(projetor.available).toBe(0)
      // A chave J-201 também está em posse hoje (aluno, 10:00-18:00).
      const chaveJ201 = response.body.items.find((item: Item) => item.type === 'key' && item.id === '1001')
      expect(chaveJ201.available).toBe(0)
    })

    it('exige a janela completa', async () => {
      const response = await request(app).get('/solicitacoes/opcoes?date=2026-10-05').set('Authorization', professor)
      expect(response.status).toBe(400)
    })

    it('exige autenticação', async () => {
      expect((await request(app).get('/solicitacoes/opcoes')).status).toBe(401)
    })
  })

  describe('POST /solicitacoes', () => {
    it('cria a solicitação como PENDENTE e ela aparece na lista', async () => {
      const created = await request(app).post('/solicitacoes').set('Authorization', professor).send(validBody)
      expect(created.status).toBe(201)
      expect(created.body.items[0]).toMatchObject({ name: 'Notebook Dell Latitude + carregador', quantity: 2, status: 'PENDENTE' })
      expect(created.body.protocol).toMatch(/^CCT-2026-\d{5}$/)

      const list = await request(app).get('/solicitacoes').set('Authorization', professor)
      expect(list.body.map((item: { id: string }) => item.id)).toContain(created.body.id)

      const detail = await request(app).get(`/solicitacoes/${created.body.id}`).set('Authorization', professor)
      expect(detail.status).toBe(200)
    })

    it('aceita vários itens de uma vez, misturando material e chave', async () => {
      const response = await request(app)
        .post('/solicitacoes')
        .set('Authorization', professor)
        .send({
          ...validBody,
          items: [
            { type: 'material', id: NOTEBOOK, quantity: 2 },
            { type: 'material', id: HDMI, quantity: 1 },
            { type: 'key', id: CHAVE_J204_SECUNDARIA },
          ],
        })
      expect(response.status).toBe(201)
      expect(response.body.items.map((item: { name: string }) => item.name)).toEqual([
        'Notebook Dell Latitude + carregador',
        'Cabo HDMI 2.0',
        'Chave J-204 · Secundária',
      ])
    })

    it('não deixa outro usuário ver a solicitação', async () => {
      const created = await request(app).post('/solicitacoes').set('Authorization', professor).send(validBody)
      const response = await request(app).get(`/solicitacoes/${created.body.id}`).set('Authorization', aluno)
      expect(response.status).toBe(404)
    })

    it('aluno autorizado pede chave e material', async () => {
      const response = await request(app)
        .post('/solicitacoes')
        .set('Authorization', aluno)
        .send({ ...validBody, items: [{ type: 'key', id: CHAVE_J204_SECUNDARIA }, { type: 'material', id: HDMI }] })
      expect(response.status).toBe(201)
      expect(response.body.items[0]).toMatchObject({ type: 'key', name: 'Chave J-204 · Secundária' })
      expect(response.body.items[1]).toMatchObject({ type: 'material', name: 'Cabo HDMI 2.0' })
    })

    it('aluno sem autorização pede material, mas não chave', async () => {
      const material = await request(app).post('/solicitacoes').set('Authorization', alunoSem).send(validBody)
      expect(material.status).toBe(201)

      const chave = await request(app)
        .post('/solicitacoes')
        .set('Authorization', alunoSem)
        .send({ ...validBody, items: [{ type: 'key', id: CHAVE_J204_SECUNDARIA }] })
      expect(chave.status).toBe(403)
      expect(chave.body.message).toBe('Aluno sem autorização ativa para solicitar chaves.')
    })

    it('professor pode pedir chave', async () => {
      const response = await request(app)
        .post('/solicitacoes')
        .set('Authorization', professor)
        .send({ ...validBody, items: [{ type: 'key', id: CHAVE_J204_SECUNDARIA }] })
      expect(response.status).toBe(201)
    })

    it('rejeita a chave de outra sala', async () => {
      const response = await request(app)
        .post('/solicitacoes')
        .set('Authorization', aluno)
        .send({ ...validBody, room: '1001', items: [{ type: 'key', id: CHAVE_J204_SECUNDARIA }] })
      expect(response.status).toBe(400)
    })

    it('rejeita item repetido e tipo inválido', async () => {
      const repetido = await request(app)
        .post('/solicitacoes')
        .set('Authorization', professor)
        .send({ ...validBody, items: [{ type: 'material', id: HDMI }, { type: 'material', id: HDMI }] })
      expect(repetido.status).toBe(400)
      expect(repetido.body.message).toBe('Há itens repetidos na solicitação.')

      const tipo = await request(app)
        .post('/solicitacoes')
        .set('Authorization', professor)
        .send({ ...validBody, items: [{ type: 'pincel', id: HDMI }] })
      expect(tipo.status).toBe(400)
    })

    it('o mesmo número em material e chave não se confunde', async () => {
      // O material 1003 (HDMI) e a chave 1003 (J-204 secundária) têm o mesmo número.
      const response = await request(app)
        .post('/solicitacoes')
        .set('Authorization', professor)
        .send({ ...validBody, items: [{ type: 'material', id: '1003' }, { type: 'key', id: '1003' }] })
      expect(response.status).toBe(201)
    })

    it.each([
      ['data no passado', { date: '2026-10-04' }, 'A data de utilização não pode estar no passado.'],
      ['devolução antes da retirada', { pickupTime: '11:00', returnTime: '09:00' }, 'O horário previsto de devolução deve ser posterior ao horário de retirada.'],
      ['devolução depois das 22:40', { pickupTime: '20:00', returnTime: '22:50' }, 'A devolução institucional deve ocorrer até 22:40.'],
      ['retirada fora do horário da Secretaria', { pickupTime: '06:00', returnTime: '08:00' }, 'A retirada deve ocorrer entre 07:30 e 21:00.'],
      ['sem itens', { items: [] }, 'Informe ao menos um item.'],
      ['data inexistente', { date: '2026-02-31' }, 'Data inválida.'],
      ['quantidade acima do limite', { items: [{ type: 'material', id: HDMI, quantity: 11 }] }, 'A quantidade máxima é 10.'],
    ])('rejeita %s', async (_name, change, message) => {
      const response = await request(app)
        .post('/solicitacoes')
        .set('Authorization', professor)
        .send({ ...validBody, ...change })
      expect(response.status).toBe(400)
      expect(response.body.message).toBe(message)
    })

    it('responde 409 quando o item já está em uso na janela', async () => {
      const response = await request(app)
        .post('/solicitacoes')
        .set('Authorization', professor)
        .send({ ...validBody, date: '2026-10-05', pickupTime: '10:00', returnTime: '12:00', items: [{ type: 'material', id: PROJETOR }] })
      expect(response.status).toBe(409)
    })

    it('responde 409 quando a quantidade passa do que sobra', async () => {
      // Cabo HDMI: 8 no total, 1 em posse hoje entre 09:00 e 17:00.
      const response = await request(app)
        .post('/solicitacoes')
        .set('Authorization', professor)
        .send({ ...validBody, date: '2026-10-05', pickupTime: '10:00', returnTime: '12:00', items: [{ type: 'material', id: HDMI, quantity: 8 }] })
      expect(response.status).toBe(409)
      expect(response.body.message).toContain('só há 7')
    })

    it('com dois pedidos ao mesmo tempo, nenhuma gravação se perde', async () => {
      // Pedido pendente não segura estoque (isso acontece na aprovação), então os dois passam.
      // O que a transação garante é que um não sobrescreve o outro.
      const send = (notes: string) =>
        request(app).post('/solicitacoes').set('Authorization', professor).send({ ...validBody, notes })
      const responses = await Promise.all([send('primeiro'), send('segundo')])
      expect(responses.map((response) => response.status)).toEqual([201, 201])

      const list = await request(app).get('/solicitacoes').set('Authorization', professor)
      const notes = list.body.map((item: { notes: string | null }) => item.notes)
      expect(notes).toEqual(expect.arrayContaining(['primeiro', 'segundo']))
      expect(list.body).toHaveLength(6) // 4 do seed + 2 novas
    })
  })
})

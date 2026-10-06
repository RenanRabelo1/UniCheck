import request from 'supertest'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestApp, fixNow, tokenOf, type TestApp } from '../../testing/testApp.js'

afterEach(() => vi.useRealTimers())
afterAll(() => {
  delete process.env.DATA_FILE
})

const validBody = {
  date: '2026-10-08',
  room: 'j-204',
  pickupTime: '09:00',
  returnTime: '11:00',
  notes: 'Aula de redes',
  items: [{ id: 'mat-notebook', quantity: 2 }],
}

describe('solicitações', () => {
  let app: TestApp
  let professor: string
  let aluno: string

  beforeEach(async () => {
    fixNow('2026-10-05T12:00:00-03:00') // "hoje" fixo, para os testes não dependerem da data real
    app = await createTestApp()
    professor = await tokenOf(app, '2048819')
    aluno = await tokenOf(app, 'aluno.autorizado@unifor.br')
  })

  describe('GET /solicitacoes/opcoes', () => {
    it('devolve salas e materiais para o professor', async () => {
      const response = await request(app).get('/solicitacoes/opcoes').set('Authorization', professor)
      expect(response.status).toBe(200)
      expect(response.body.rooms).toHaveLength(3)
      expect(response.body.materials).toHaveLength(4)
      expect(response.body.keysByRoom).toBeUndefined()
    })

    it('devolve chaves por sala e a autorização para o aluno', async () => {
      const response = await request(app).get('/solicitacoes/opcoes').set('Authorization', aluno)
      expect(response.status).toBe(200)
      expect(response.body.keysByRoom['j-204']).toHaveLength(2)
      expect(response.body.authorization).toEqual({
        project: 'Laboratório de Redes',
        responsibleProfessor: 'Prof. Ricardo Mendes',
      })
    })

    it('calcula a disponibilidade para a janela pedida', async () => {
      const response = await request(app)
        .get('/solicitacoes/opcoes?date=2026-10-05&pickupTime=10:00&returnTime=12:00')
        .set('Authorization', professor)
      const projetor = response.body.materials.find((item: { value: string }) => item.value === 'mat-projetor')
      expect(projetor.available).toBe(0)
    })

    it('exige a janela completa', async () => {
      const response = await request(app).get('/solicitacoes/opcoes?date=2026-10-05').set('Authorization', professor)
      expect(response.status).toBe(400)
    })

    it('bloqueia aluno sem autorização', async () => {
      const semAutorizacao = await tokenOf(app, 'aluno.naoautorizado@unifor.br')
      const response = await request(app).get('/solicitacoes/opcoes').set('Authorization', semAutorizacao)
      expect(response.status).toBe(403)
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

      const list = await request(app).get('/solicitacoes').set('Authorization', professor)
      expect(list.body[0].id).toBe(created.body.id)

      const detail = await request(app).get(`/solicitacoes/${created.body.id}`).set('Authorization', professor)
      expect(detail.status).toBe(200)
    })

    it('não deixa outro usuário ver a solicitação', async () => {
      const created = await request(app).post('/solicitacoes').set('Authorization', professor).send(validBody)
      const response = await request(app).get(`/solicitacoes/${created.body.id}`).set('Authorization', aluno)
      expect(response.status).toBe(404)
    })

    it('aluno autorizado pede a chave da sala', async () => {
      const response = await request(app)
        .post('/solicitacoes')
        .set('Authorization', aluno)
        .send({ ...validBody, items: [{ id: 'chv-j204-s' }] })
      expect(response.status).toBe(201)
      expect(response.body.items[0]).toMatchObject({ type: 'key', name: 'Chave J-204 · Secundária' })
    })

    it('aluno sem autorização não pode pedir', async () => {
      const semAutorizacao = await tokenOf(app, 'aluno.naoautorizado@unifor.br')
      const response = await request(app)
        .post('/solicitacoes')
        .set('Authorization', semAutorizacao)
        .send({ ...validBody, items: [{ id: 'chv-j204-s' }] })
      expect(response.status).toBe(403)
    })

    it('professor não pode pedir chave', async () => {
      const response = await request(app)
        .post('/solicitacoes')
        .set('Authorization', professor)
        .send({ ...validBody, items: [{ id: 'chv-j204-s' }] })
      expect(response.status).toBe(400)
    })

    it('rejeita a chave de outra sala', async () => {
      const response = await request(app)
        .post('/solicitacoes')
        .set('Authorization', aluno)
        .send({ ...validBody, room: 'j-201', items: [{ id: 'chv-j204-s' }] })
      expect(response.status).toBe(400)
    })

    it.each([
      ['data no passado', { date: '2026-10-04' }, 'A data de utilização não pode estar no passado.'],
      ['devolução antes da retirada', { pickupTime: '11:00', returnTime: '09:00' }, 'O horário previsto de devolução deve ser posterior ao horário de retirada.'],
      ['devolução depois das 22:40', { pickupTime: '20:00', returnTime: '22:50' }, 'A devolução institucional deve ocorrer até 22:40.'],
      ['retirada fora do horário da Secretaria', { pickupTime: '06:00', returnTime: '08:00' }, 'A retirada deve ocorrer entre 07:30 e 21:00.'],
      ['sem itens', { items: [] }, 'Informe ao menos um item.'],
      ['data inexistente', { date: '2026-02-31' }, 'Data inválida.'],
      ['quantidade acima do limite', { items: [{ id: 'mat-hdmi', quantity: 11 }] }, 'A quantidade máxima é 10.'],
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
        .send({ ...validBody, date: '2026-10-05', pickupTime: '10:00', returnTime: '12:00', items: [{ id: 'mat-projetor' }] })
      expect(response.status).toBe(409)
    })

    it('responde 409 quando a quantidade passa do que sobra', async () => {
      // Cabo HDMI: 8 no total, 1 em posse hoje entre 09:00 e 17:00.
      const response = await request(app)
        .post('/solicitacoes')
        .set('Authorization', professor)
        .send({ ...validBody, date: '2026-10-05', pickupTime: '10:00', returnTime: '12:00', items: [{ id: 'mat-hdmi', quantity: 8 }] })
      expect(response.status).toBe(409)
      expect(response.body.message).toContain('só há 7')
    })

    it('com dois pedidos ao mesmo tempo, nenhuma gravação se perde', async () => {
      // Pedido pendente não segura estoque (isso acontece na aprovação), então os dois passam.
      // O que a fila do banco garante é que um não sobrescreve o outro.
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

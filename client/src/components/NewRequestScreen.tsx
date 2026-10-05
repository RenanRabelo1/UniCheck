import { FormEvent, useMemo, useState } from 'react'
import { DashboardSession } from '../modules/dashboard/dashboard.types'

type NewRequestScreenProps = {
  session: DashboardSession
  onBack: () => void
}

const rooms = [
  { value: 'j-201', label: 'J-201 · Laboratório de Redes' },
  { value: 'j-204', label: 'J-204 · Laboratório de Desenvolvimento' },
  { value: 'j-311', label: 'J-311 · Sala de Projetos' },
]

const materials = [
  { value: 'projector', label: 'Projetor Epson WXGA · Patrimônio #24810' },
  { value: 'notebook', label: 'Notebook Dell Latitude + carregador' },
  { value: 'hdmi', label: 'Cabo HDMI 2.0 · 8 unidades disponíveis' },
  { value: 'arduino', label: 'Kit Arduino e Sensores IoT · Bancada B02' },
]

const keysByRoom: Record<string, { value: string; label: string }[]> = {
  'j-201': [{ value: 'j201-primary', label: 'Chave J-201 · Primária' }],
  'j-204': [{ value: 'j204-primary', label: 'Chave J-204 · Primária' }, { value: 'j204-secondary', label: 'Chave J-204 · Secundária' }],
  'j-311': [{ value: 'j311-primary', label: 'Chave J-311 · Primária' }],
}

export function NewRequestScreen({ session, onBack }: NewRequestScreenProps) {
  const isStudent = session.role === 'student'
  const [date, setDate] = useState('')
  const [room, setRoom] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [returnTime, setReturnTime] = useState('')
  const [item, setItem] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [isReadyForReview, setIsReadyForReview] = useState(false)

  const itemOptions = useMemo(() => (isStudent ? keysByRoom[room] ?? [] : materials), [isStudent, room])

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!date || !room || !pickupTime || !returnTime || !item) {
      setError('Preencha todos os campos obrigatórios antes de continuar.')
      return
    }

    if (returnTime <= pickupTime) {
      setError('O horário previsto de devolução deve ser posterior ao horário de retirada.')
      return
    }

    setError('')
    setIsReadyForReview(true)
  }

  return (
    <main className="request-page">
      <header className="request-header">
        <div className="request-header-content">
          <div className="dashboard-brand">
            <img src="/brand/unifor.svg" alt="Unifor" />
            <span />
            <div><strong>Sistema CCT</strong><small>Controle de Empréstimos · Bloco J-02</small></div>
          </div>
          <button type="button" className="back-to-dashboard" onClick={onBack}>← Voltar para início</button>
        </div>
      </header>

      <section className="request-content">
        <div className="request-context">
          <button type="button" onClick={onBack}>← Voltar para o painel inicial</button>
          <span><i /> Secretaria CCT · Bloco J-02</span>
        </div>

        <header className="request-title">
          <h1>Nova solicitação</h1>
          <p>
            {isStudent
              ? 'Informe o período, a sala e a chave de laboratório que deseja requisitar para seu projeto.'
              : 'Informe o período e a sala de utilização, além dos materiais que deseja requisitar para sua atividade acadêmica.'}
          </p>
          <div className="request-info"><b>ⓘ</b><div><strong>Análise de liberação institucional</strong><span>As solicitações passam pela checagem da Secretaria do Bloco J-02. A devolução institucional deve ocorrer até 22h40.</span></div></div>
        </header>

        <div className="request-steps" aria-label="Etapas da solicitação">
          <span className="active"><b>1</b> Dados de utilização</span><i />
          <span><b>2</b> {isStudent ? 'Chave solicitada' : 'Materiais solicitados'}</span><i />
          <span><b>3</b> Confirmação</span>
        </div>

        {isReadyForReview ? (
          <section className="request-success" role="status">
            <span>✓</span>
            <div>
              <h2>Dados prontos para revisão</h2>
              <p>A próxima tela exibirá o resumo e o termo de responsabilidade antes do envio à Secretaria CCT.</p>
            </div>
            <button type="button" onClick={() => setIsReadyForReview(false)}>Editar solicitação</button>
          </section>
        ) : (
          <form className="request-form" onSubmit={submitRequest} noValidate>
            <section className="request-section">
              <header>
                <span>◷</span><div><h2>1. Dados de utilização</h2><p>Defina a alocação e a faixa de horário.</p></div><b>* Campos obrigatórios</b>
              </header>
              <div className="request-fields">
                <label>Data de utilização *<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
                <label>Sala / local *<select value={room} onChange={(event) => { setRoom(event.target.value); setItem('') }}><option value="">Selecione a sala</option>{rooms.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <label>Horário de retirada *<input type="time" value={pickupTime} onChange={(event) => setPickupTime(event.target.value)} /></label>
                <label>Horário previsto de devolução *<input type="time" value={returnTime} onChange={(event) => setReturnTime(event.target.value)} /></label>
              </div>
              <label className="request-notes">Observações <small>(opcional)</small><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Descreva o propósito da utilização, disciplina ou projeto..." rows={3} /></label>
            </section>

            <section className="request-section">
              <header>
                <span>{isStudent ? '🔑' : '▣'}</span><div><h2>2. {isStudent ? 'Chave solicitada' : 'Material solicitado'}</h2><p>{isStudent ? 'Alunos autorizados podem solicitar somente chaves de laboratórios.' : 'Professores podem solicitar materiais e equipamentos disponíveis.'}</p></div>
              </header>

              {isStudent && <div className="authorization-notice"><b>✓</b><div><strong>Autorização ativa</strong><span>Projeto: Laboratório de Redes · Professor responsável: Prof. Ricardo Mendes</span></div></div>}

              <div className="item-request-card">
                <div className="item-card-title"><span>{isStudent ? '🔑' : '▣'}</span><strong>{isStudent ? 'Selecione a chave' : 'Selecione o material'}</strong></div>
                <div className={isStudent ? 'item-fields student' : 'item-fields'}>
                  <label>{isStudent ? 'Chave *' : 'Material *'}<select value={item} onChange={(event) => setItem(event.target.value)} disabled={isStudent && !room}><option value="">{isStudent && !room ? 'Selecione a sala primeiro' : 'Selecione uma opção'}</option>{itemOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  {!isStudent && <label>Quantidade *<input type="number" min="1" max="10" value={quantity} onChange={(event) => setQuantity(Number(event.target.value) || 1)} /></label>}
                </div>
              </div>
            </section>

            {error && <p className="request-error" role="alert">⚠ {error}</p>}
            <footer className="request-actions"><button type="button" className="cancel-request" onClick={onBack}>Cancelar</button><button type="submit" className="continue-request">Revisar e confirmar →</button></footer>
          </form>
        )}
      </section>
    </main>
  )
}

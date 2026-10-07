import Icon from './components/Icon.jsx'
import { dashboard as d } from './data.js'

// "Terça-Feira, 6 De Outubro De 2026" (igual ao Figma)
function dataExtensa(date = new Date()) {
  return date
    .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .replace(/(^|[\s-])(\p{L})/gu, (_, s, c) => s + c.toUpperCase())
}

const nomeCompleto = `${d.usuario.titulo} ${d.usuario.nome}`

const stats = [
  { cor: 'orange', titulo: 'Solicitações pendentes', valor: d.resumo.pendentes, texto: 'Aguardando análise da secretaria', icone: 'list' },
  { cor: 'green', titulo: 'Solicitações aprovadas', valor: d.resumo.aprovadas, texto: 'Prontas para retirada', icone: 'check' },
  { cor: 'blue', titulo: 'Materiais em posse', valor: d.resumo.emPosse, texto: 'Itens retirados e não devolvidos', icone: 'box' },
]

export default function App() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/">
            <span className="logo">CCT</span>
            <span className="brand-text"><strong>UNIFOR</strong><small>C. Ciências Tecnológicas</small></span>
          </a>
          <nav className="nav">
            <a href="/" className="active"><Icon name="home" />Início</a>
            <a href="#"><Icon name="plus" />Nova Solicitação</a>
            <a href="#"><Icon name="list" />Minhas Solicitações</a>
          </nav>
          <div className="user">
            <span className="avatar">{d.usuario.iniciais}</span>
            <span className="user-info"><strong>{nomeCompleto}</strong><em>{d.usuario.perfil}</em></span>
            <a href="#" className="logout"><Icon name="out" />Sair</a>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="hero card">
          <div>
            <span className="chip"><i className="dot" />{d.local}</span>
            <h1>Olá, <span className="name">{nomeCompleto}</span></h1>
            <p className="date">{dataExtensa()}</p>
            <p className="mat"><i className="dot" />Matrícula: <strong>{d.usuario.matricula}</strong></p>
          </div>
          <div className="hero-actions">
            <a href="#" className="btn btn-primary"><Icon name="plus" />Nova Solicitação</a>
            <a href="#" className="btn btn-outline"><Icon name="list" />Minhas Solicitações</a>
          </div>
        </section>

        <section className="stats">
          {stats.map((s) => (
            <article key={s.titulo} className={`card stat ${s.cor}`}>
              <div><h3>{s.titulo}</h3><b>{s.valor}</b><p>{s.texto}</p></div>
              <span className="stat-ic"><Icon name={s.icone} /></span>
            </article>
          ))}
        </section>

        <section className="actions">
          <a href="#" className="card action">
            <span className="action-ic solid"><Icon name="plus" /></span>
            <div><strong>Nova Solicitação</strong><p>Solicite materiais e equipamentos</p></div>
          </a>
          <a href="#" className="card action">
            <span className="action-ic"><Icon name="list" /></span>
            <div><strong>Minhas Solicitações</strong><p>Acompanhe o status de cada pedido</p></div>
          </a>
        </section>

        <section className="recent">
          <div className="recent-head"><h2>Atividade Recente</h2><a href="#">Ver todas</a></div>
          <div className="card table-wrap">
            <table>
              <thead>
                <tr><th>Nº</th><th>Data</th><th>Local</th><th>Itens</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {d.atividades.map((a) => (
                  <tr key={a.numero}>
                    <td className="num">{a.numero}</td>
                    <td>{a.data}</td>
                    <td>{a.local}</td>
                    <td>{a.itens}</td>
                    <td><span className={`status s-${a.status.toLowerCase()}`}><i />{a.status}</span></td>
                    <td className="ver"><a href="#">Ver</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  )
}

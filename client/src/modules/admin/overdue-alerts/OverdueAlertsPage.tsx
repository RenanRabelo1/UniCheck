import { useMemo, useState } from 'react';
import { overdueAlertsMock } from './overdueAlerts.mock';
import type { OverdueAlert, OverdueAlertFilters } from './overdueAlerts.types';
import './overdueAlerts.css';

const initialFilters: OverdueAlertFilters = {
  period: 'Todos',
  type: 'Todos',
  link: 'Todos',
};

export interface OverdueAlertsPageProps {
  onRegisterReturn?: (alert: OverdueAlert) => void;
  onExportTerm?: (alert: OverdueAlert) => void;
  onSendReminder?: (alerts: OverdueAlert[]) => void;
}

/** Painel autocontido de alertas; suas ações são deliberadamente demonstrativas. */
export function OverdueAlertsPage({
  onRegisterReturn,
  onExportTerm,
  onSendReminder,
}: OverdueAlertsPageProps) {
  const [filters, setFilters] = useState<OverdueAlertFilters>(initialFilters);
  const [code, setCode] = useState('');
  const [scanMessage, setScanMessage] = useState('Aguardando um código para demonstração.');
  const [feedback, setFeedback] = useState('');

  const filteredAlerts = useMemo(() => {
    return overdueAlertsMock.filter((alert) => {
      const matchesType = filters.type === 'Todos' || alert.type === filters.type;
      const matchesLink =
        filters.link === 'Todos' || alert.link.toLowerCase().includes(filters.link.toLowerCase());
      return matchesType && matchesLink;
    });
  }, [filters]);

  const updateFilter = <Key extends keyof OverdueAlertFilters>(
    key: Key,
    value: OverdueAlertFilters[Key],
  ) => setFilters((current) => ({ ...current, [key]: value }));

  const scanCode = () => {
    const found = overdueAlertsMock.find((alert) => alert.code.toLowerCase() === code.trim().toLowerCase());
    setScanMessage(found ? `Demonstração: ${found.itemName} está em atraso.` : 'Nenhum item demonstrativo encontrado.');
  };

  const notify = (message: string) => setFeedback(message);

  return (
    <section className="overdue-alerts" aria-labelledby="overdue-alerts-title">
      <header className="overdue-alerts__header">
        <div>
          <p className="overdue-alerts__eyebrow">Administrativo</p>
          <h1 id="overdue-alerts-title">Alertas de atraso</h1>
          <p>Itens ainda não devolvidos até as 22:40.</p>
        </div>
        <button
          className="overdue-alerts__button overdue-alerts__button--primary"
          type="button"
          onClick={() => {
            onSendReminder?.(filteredAlerts);
            notify('Demonstração: lembrete coletivo preparado, sem envio real.');
          }}
        >
          Enviar lembrete coletivo
        </button>
      </header>

      <div className="overdue-alerts__notice" role="status">
        Todas as ações desta tela são demonstrativas e não alteram registros nem enviam comunicações.
      </div>

      <div className="overdue-alerts__summary" aria-label="Resumo de atrasos">
        <article><strong>{overdueAlertsMock.length}</strong><span>itens em atraso</span></article>
        <article><strong>{overdueAlertsMock.filter((alert) => alert.type === 'Chave').length}</strong><span>chaves pendentes</span></article>
        <article><strong>{overdueAlertsMock.filter((alert) => alert.status === 'Pendente').length}</strong><span>aguardando retorno</span></article>
      </div>

      <div className="overdue-alerts__toolbar">
        <label>
          Período
          <select value={filters.period} onChange={(event) => updateFilter('period', event.target.value as OverdueAlertFilters['period'])}>
            <option>Hoje</option><option>7 dias</option><option>30 dias</option><option>Todos</option>
          </select>
        </label>
        <label>
          Tipo
          <select value={filters.type} onChange={(event) => updateFilter('type', event.target.value as OverdueAlertFilters['type'])}>
            <option>Todos</option><option>Chave</option><option>Material</option>
          </select>
        </label>
        <label>
          Vínculo
          <select value={filters.link} onChange={(event) => updateFilter('link', event.target.value as OverdueAlertFilters['link'])}>
            <option>Todos</option><option>Aluno</option><option>Professor</option><option>Projeto</option>
          </select>
        </label>
        <button className="overdue-alerts__button overdue-alerts__button--quiet" type="button" onClick={() => setFilters(initialFilters)}>Limpar filtros</button>
      </div>

      <div className="overdue-alerts__scanner">
        <div>
          <h2>Leitor de código</h2>
          <p>Simule a leitura digitando um código, como CH-2.14.</p>
        </div>
        <input value={code} onChange={(event) => setCode(event.target.value)} aria-label="Código do item" placeholder="Código do item" />
        <button className="overdue-alerts__button" type="button" onClick={scanCode}>Ler código</button>
        <output>{scanMessage}</output>
      </div>

      {feedback && <p className="overdue-alerts__feedback" role="status">{feedback}</p>}

      <div className="overdue-alerts__list" aria-live="polite">
        {filteredAlerts.map((alert) => (
          <article className="overdue-alerts__item" key={alert.id}>
            <div className="overdue-alerts__item-main">
              <span className="overdue-alerts__tag">{alert.type}</span>
              <h2>{alert.itemName}</h2>
              <p><strong>{alert.code}</strong> · Em posse de {alert.borrower}</p>
              <p>{alert.link} · Prazo: {alert.dueAt}</p>
            </div>
            <div className="overdue-alerts__item-status">
              <strong>{alert.delayLabel}</strong>
              <span>{alert.status}</span>
            </div>
            <div className="overdue-alerts__actions">
              <button type="button" onClick={() => { onRegisterReturn?.(alert); notify(`Demonstração: devolução de ${alert.code} não foi registrada.`); }}>Registrar devolução</button>
              <button type="button" onClick={() => { onExportTerm?.(alert); notify(`Demonstração: termo de ${alert.code} não foi exportado.`); }}>Exportar termo</button>
            </div>
          </article>
        ))}
        {filteredAlerts.length === 0 && <p className="overdue-alerts__empty">Nenhum alerta demonstrativo corresponde aos filtros.</p>}
      </div>
    </section>
  );
}

export default OverdueAlertsPage;

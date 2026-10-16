import { useMemo, useState } from 'react';

import { requestAnalysisMock } from './requestAnalysis.mock';
import type {
  ItemVisualDecision,
  RequestAnalysisScreenProps,
  RequestItemDecision,
} from './types';
import './RequestAnalysisScreen.css';

type DecisionState = Record<string, ItemVisualDecision>;

const initialDecisions = (itemIds: string[]): DecisionState =>
  Object.fromEntries(
    itemIds.map((itemId) => [
      itemId,
      { itemId, decision: 'PENDING' as RequestItemDecision, refusalReason: '' },
    ]),
  );

const decisionLabel: Record<RequestItemDecision, string> = {
  PENDING: 'Aguardando parecer',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
};

export function RequestAnalysisScreen({
  request = requestAnalysisMock,
  onBackToPending,
  onCompleteAnalysis,
}: RequestAnalysisScreenProps) {
  const [decisions, setDecisions] = useState<DecisionState>(() =>
    initialDecisions(request.items.map(({ id }) => id)),
  );
  const [completed, setCompleted] = useState(false);

  const allItemsReviewed = request.items.every(
    ({ id }) => decisions[id]?.decision !== 'PENDING',
  );
  const rejectedItemsHaveReasons = request.items.every(({ id }) => {
    const itemDecision = decisions[id];
    return (
      itemDecision?.decision !== 'REJECTED' ||
      itemDecision.refusalReason.trim().length > 0
    );
  });
  const canComplete = allItemsReviewed && rejectedItemsHaveReasons && !completed;

  const summary = useMemo(
    () =>
      Object.values(decisions).reduce(
        (total, { decision }) => ({
          ...total,
          [decision]: total[decision] + 1,
        }),
        { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<
          RequestItemDecision,
          number
        >,
      ),
    [decisions],
  );

  const updateItemDecision = (itemId: string, decision: RequestItemDecision) => {
    setDecisions((current) => ({
      ...current,
      [itemId]: {
        ...current[itemId],
        decision,
        refusalReason:
          decision === 'REJECTED' ? current[itemId].refusalReason : '',
      },
    }));
  };

  const updateRefusalReason = (itemId: string, refusalReason: string) => {
    setDecisions((current) => ({
      ...current,
      [itemId]: { ...current[itemId], refusalReason },
    }));
  };

  const completeAnalysis = () => {
    if (!canComplete) {
      return;
    }

    const result = {
      protocol: request.protocol,
      items: request.items.map(({ id }) => ({ ...decisions[id] })),
      concludedAt: new Date().toISOString(),
    };

    setCompleted(true);
    onCompleteAnalysis(result);
  };

  return (
    <main className="request-analysis" aria-labelledby="request-analysis-title">
      <header className="request-analysis__header">
        <button className="request-analysis__back" onClick={onBackToPending} type="button">
          ← Voltar para pendências
        </button>
        <p className="request-analysis__eyebrow">Solicitação {request.protocol}</p>
        <h1 id="request-analysis-title">Análise da solicitação</h1>
        <p className="request-analysis__subtitle">
          Registre um parecer visual para cada item antes de concluir esta demonstração.
        </p>
      </header>

      <section className="request-analysis__notice" aria-label="Aviso sobre dados demonstrativos">
        <strong>Modo demonstrativo.</strong> As decisões abaixo ficam somente no estado local desta tela e não emitem um parecer oficial real.
      </section>

      <section className="request-analysis__request-data" aria-labelledby="request-data-title">
        <div>
          <p className="request-analysis__section-label">Solicitante</p>
          <h2 id="request-data-title">{request.requester.name}</h2>
          <p>{request.requester.role} · Matrícula {request.requester.registration}</p>
          <p>{request.requester.email} · {request.requester.phone}</p>
        </div>
        <dl className="request-analysis__metadata">
          <div><dt>Solicitada em</dt><dd>{request.requestedAt}</dd></div>
          <div><dt>Finalidade</dt><dd>{request.purpose}</dd></div>
          <div><dt>Previsão de devolução</dt><dd>{request.returnDeadline}</dd></div>
        </dl>
      </section>

      <section className="request-analysis__items" aria-labelledby="items-title">
        <div className="request-analysis__section-heading">
          <div>
            <p className="request-analysis__section-label">Itens solicitados</p>
            <h2 id="items-title">Disponibilidade e parecer individual</h2>
          </div>
          <span>{request.items.length} itens</span>
        </div>

        <div className="request-analysis__item-list">
          {request.items.map((item) => {
            const itemDecision = decisions[item.id];
            const isRejected = itemDecision.decision === 'REJECTED';

            return (
              <article className="request-analysis__item" key={item.id}>
                <div className="request-analysis__item-info">
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <span className={`request-analysis__availability request-analysis__availability--${item.availableQuantity > 0 ? 'available' : 'unavailable'}`}>
                    {item.availabilityLabel}: {item.availableQuantity} disponível(is)
                  </span>
                </div>
                <p className="request-analysis__quantity">Quantidade solicitada: <strong>{item.requestedQuantity}</strong></p>

                <div className="request-analysis__decision" aria-label={`Parecer para ${item.name}`}>
                  <span className={`request-analysis__status request-analysis__status--${itemDecision.decision.toLowerCase()}`}>
                    {decisionLabel[itemDecision.decision]}
                  </span>
                  <div className="request-analysis__actions">
                    <button
                      className="request-analysis__approve"
                      disabled={completed}
                      onClick={() => updateItemDecision(item.id, 'APPROVED')}
                      type="button"
                    >
                      Aprovar
                    </button>
                    <button
                      className="request-analysis__reject"
                      disabled={completed}
                      onClick={() => updateItemDecision(item.id, 'REJECTED')}
                      type="button"
                    >
                      Recusar
                    </button>
                  </div>
                </div>

                {isRejected && (
                  <label className="request-analysis__reason">
                    Motivo da recusa <span aria-hidden="true">*</span>
                    <textarea
                      disabled={completed}
                      onChange={(event) => updateRefusalReason(item.id, event.target.value)}
                      placeholder="Explique por que este item não pode ser atendido."
                      required
                      value={itemDecision.refusalReason}
                    />
                    {!itemDecision.refusalReason.trim() && (
                      <small>Informe o motivo para concluir o parecer visual.</small>
                    )}
                  </label>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="request-analysis__summary" aria-labelledby="summary-title">
        <div>
          <p className="request-analysis__section-label">Resumo do parecer</p>
          <h2 id="summary-title">Resultado da análise</h2>
        </div>
        <div className="request-analysis__summary-counts">
          <span><strong>{summary.APPROVED}</strong> aprovados</span>
          <span><strong>{summary.REJECTED}</strong> recusados</span>
          <span><strong>{summary.PENDING}</strong> pendentes</span>
        </div>
      </section>

      <footer className="request-analysis__footer">
        <div aria-live="polite">
          {completed
            ? 'Parecer demonstrativo concluído. Nenhuma informação foi persistida.'
            : !allItemsReviewed
              ? 'Analise todos os itens para concluir.'
              : !rejectedItemsHaveReasons
                ? 'Preencha o motivo de cada recusa para concluir.'
                : 'Todos os itens estão prontos para a conclusão.'}
        </div>
        <button
          className="request-analysis__complete"
          disabled={!canComplete}
          onClick={completeAnalysis}
          type="button"
        >
          Concluir Análise e Emitir Parecer Oficial
        </button>
      </footer>
    </main>
  );
}

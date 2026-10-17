import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import {
  approvedCheckoutRequests,
  checkoutCoordinators,
} from './checkout-operations.mock';
import type {
  CheckoutConfirmationResult,
  CheckoutOperationsProps,
} from './checkout-operations.types';
import './checkout-operations.css';

const demonstrativeCheckoutDate = '16/10/2026';
const demonstrativeCheckoutTime = '14:30';

export function CheckoutOperations({
  onCheckoutConfirmed,
}: CheckoutOperationsProps) {
  const [search, setSearch] = useState('');
  const [requestId, setRequestId] = useState(approvedCheckoutRequests[0].id);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [coordinatorId, setCoordinatorId] = useState(checkoutCoordinators[0].id);
  const [confirmation, setConfirmation] = useState<CheckoutConfirmationResult | null>(null);

  const availableRequests = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase('pt-BR');
    if (!searchTerm) return approvedCheckoutRequests;

    return approvedCheckoutRequests.filter((request) =>
      [request.protocol, request.applicant.name, request.applicant.registration]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(searchTerm),
    );
  }, [search]);

  const request =
    approvedCheckoutRequests.find((candidate) => candidate.id === requestId) ??
    availableRequests[0];

  const selectRequest = (nextRequestId: string) => {
    setRequestId(nextRequestId);
    setSelectedItemIds([]);
    setAcceptedTerms(false);
    setConfirmation(null);
  };

  const toggleItem = (itemId: string) => {
    setSelectedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
    setConfirmation(null);
  };

  const confirmCheckout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!request || !acceptedTerms || selectedItemIds.length === 0) return;

    const result: CheckoutConfirmationResult = {
      demonstrationProtocol: `RET-DEM-${request.protocol.replace('SOL-', '')}`,
      requestProtocol: request.protocol,
      coordinatorId,
      checkedOutItemIds: selectedItemIds,
      checkedOutAt: `${demonstrativeCheckoutDate} ${demonstrativeCheckoutTime}`,
      isDemonstration: true,
    };

    setConfirmation(result);
    onCheckoutConfirmed?.(result);
  };

  if (!request) {
    return (
      <section className="checkout-operations" aria-labelledby="checkout-title">
        <h1 id="checkout-title">Retirada presencial</h1>
        <p>Nenhuma solicitação aprovada corresponde à busca.</p>
      </section>
    );
  }

  const confirmationDisabled = !acceptedTerms || selectedItemIds.length === 0;

  return (
    <section className="checkout-operations" aria-labelledby="checkout-title">
      <header className="checkout-operations__header">
        <div>
          <p className="checkout-operations__eyebrow">Operação presencial</p>
          <h1 id="checkout-title">Retirada e transferência de custódia</h1>
          <p>Selecione somente itens já aprovados para registrar esta demonstração.</p>
        </div>
        <span className="checkout-operations__mock-badge">Demonstração — não persistida</span>
      </header>

      <div className="checkout-operations__layout">
        <aside className="checkout-operations__requests" aria-label="Solicitações aprovadas">
          <label htmlFor="checkout-search">Buscar solicitação aprovada</label>
          <input
            id="checkout-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Protocolo, nome ou matrícula"
          />
          <div className="checkout-operations__request-list">
            {availableRequests.map((candidate) => (
              <button
                className={candidate.id === request.id ? 'is-selected' : ''}
                key={candidate.id}
                type="button"
                onClick={() => selectRequest(candidate.id)}
              >
                <strong>{candidate.protocol}</strong>
                <span>{candidate.applicant.name}</span>
                <small>{candidate.approvedItems.length} item(ns) aprovado(s)</small>
              </button>
            ))}
          </div>
        </aside>

        <form className="checkout-operations__form" onSubmit={confirmCheckout}>
          <section className="checkout-operations__panel" aria-labelledby="dossier-title">
            <div className="checkout-operations__panel-heading">
              <div>
                <p className="checkout-operations__eyebrow">Dossiê do solicitante</p>
                <h2 id="dossier-title">{request.applicant.name}</h2>
              </div>
              <span className="checkout-operations__approved">Aprovada</span>
            </div>
            <dl className="checkout-operations__dossier">
              <div><dt>Protocolo</dt><dd>{request.protocol}</dd></div>
              <div><dt>Perfil</dt><dd>{request.applicant.role}</dd></div>
              <div><dt>Matrícula</dt><dd>{request.applicant.registration}</dd></div>
              <div><dt>Solicitada em</dt><dd>{request.requestedAt}</dd></div>
              <div><dt>E-mail</dt><dd>{request.applicant.email}</dd></div>
              <div><dt>Telefone</dt><dd>{request.applicant.phone}</dd></div>
              {request.applicant.project && <div><dt>Projeto</dt><dd>{request.applicant.project}</dd></div>}
            </dl>
          </section>

          <section className="checkout-operations__panel" aria-labelledby="items-title">
            <div className="checkout-operations__panel-heading">
              <div>
                <p className="checkout-operations__eyebrow">Etapa 1</p>
                <h2 id="items-title">Itens aprovados para retirada</h2>
              </div>
              <span>{selectedItemIds.length} selecionado(s)</span>
            </div>
            <div className="checkout-operations__items">
              {request.approvedItems.map((item) => (
                <label className="checkout-operations__item" key={item.id}>
                  <input
                    type="checkbox"
                    checked={selectedItemIds.includes(item.id)}
                    onChange={() => toggleItem(item.id)}
                  />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.identifier} · {item.details}</small>
                  </span>
                  <em>{item.kind === 'CHAVE' ? 'Chave' : 'Material'}</em>
                </label>
              ))}
            </div>
          </section>

          <section className="checkout-operations__panel checkout-operations__confirmation" aria-labelledby="confirmation-title">
            <div>
              <p className="checkout-operations__eyebrow">Etapa 2</p>
              <h2 id="confirmation-title">Responsável e termo</h2>
            </div>
            <label htmlFor="checkout-coordinator">Coordenador responsável</label>
            <select
              id="checkout-coordinator"
              value={coordinatorId}
              onChange={(event) => setCoordinatorId(event.target.value)}
            >
              {checkoutCoordinators.map((coordinator) => (
                <option key={coordinator.id} value={coordinator.id}>
                  {coordinator.name} — {coordinator.registration}
                </option>
              ))}
            </select>
            <div className="checkout-operations__datetime" aria-label="Data e hora da retirada demonstrativa">
              <span><b>Data</b>{demonstrativeCheckoutDate}</span>
              <span><b>Hora</b>{demonstrativeCheckoutTime}</span>
            </div>
            <label className="checkout-operations__terms">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => {
                  setAcceptedTerms(event.target.checked);
                  setConfirmation(null);
                }}
              />
              <span>Confirmo o aceite do termo de responsabilidade pelo solicitante.</span>
            </label>
            <button
              className="checkout-operations__submit"
              disabled={confirmationDisabled}
              type="submit"
            >
              Confirmar Retirada e Transferir Custódia
            </button>
            {confirmationDisabled && (
              <p className="checkout-operations__validation" role="status">
                Selecione ao menos um item e confirme o aceite do termo para continuar.
              </p>
            )}
          </section>

          {confirmation && (
            <output className="checkout-operations__result" aria-live="polite">
              <strong>Retirada demonstrativa confirmada</strong>
              <span>Protocolo de retirada: {confirmation.demonstrationProtocol}</span>
              <small>O callback tipado foi acionado; nenhum dado foi persistido.</small>
            </output>
          )}
        </form>
      </div>
    </section>
  );
}

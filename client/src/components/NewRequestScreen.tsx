import { useState, type FormEvent } from "react";
import type { DashboardSession } from "../modules/dashboard/dashboard.types";
import { AppTopNav, type AppTopNavExtras } from "./AppTopNav";
import type {
  RequestConfirmationData,
  RequestDraft,
} from "./RequestFlow.types";
import {
  ItemPicker,
  itemKey,
  unavailableReason,
} from "../modules/solicitacoes/ItemPicker";
import { useRequestOptions } from "../modules/solicitacoes/useRequestOptions";
import type { CatalogItem } from "../modules/solicitacoes/types";

type NewRequestScreenProps = {
  session: DashboardSession;
  /** Preenche o formulário de novo ao voltar da tela de confirmação. */
  initialDraft?: RequestDraft;
  /** Botões extras da barra do topo (Sair, Materiais). */
  navExtras?: AppTopNavExtras;
  onBack: () => void;
  onMyRequests: () => void;
  onReview: (request: RequestConfirmationData) => void;
};

const MIN_PICKUP = "07:30";
const MAX_PICKUP = "21:00";
const MAX_RETURN = "22:40";

/** Transforma o rascunho salvo em { "material:3": 2, "key:1": 1 }. */
function selectionFromDraft(draft?: RequestDraft) {
  const selected: Record<string, number> = {};
  for (const item of draft?.items ?? []) {
    selected[itemKey(item)] = item.quantity;
  }
  return selected;
}

export function NewRequestScreen({
  session,
  initialDraft,
  onBack,
  onMyRequests,
  onReview,
  navExtras,
}: NewRequestScreenProps) {
  const isStudent = session.role === "student";
  const [date, setDate] = useState(initialDraft?.date ?? "");
  const [room, setRoom] = useState(initialDraft?.roomId ?? "");
  const [pickupTime, setPickupTime] = useState(initialDraft?.pickupTime ?? "");
  const [returnTime, setReturnTime] = useState(initialDraft?.returnTime ?? "");
  const [notes, setNotes] = useState(initialDraft?.notes ?? "");
  const [selected, setSelected] = useState<Record<string, number>>(() =>
    selectionFromDraft(initialDraft),
  );
  const [error, setError] = useState("");

  const options = useRequestOptions({ date, pickupTime, returnTime });
  const catalog = options.data?.items ?? [];
  const rooms = options.data?.rooms ?? [];
  const hasWindow = Boolean(
    date && pickupTime && returnTime && returnTime > pickupTime,
  );

  function toggleItem(item: CatalogItem) {
    const key = itemKey(item);
    setError("");
    setSelected((current) => {
      const next = { ...current };
      if (key in next) delete next[key];
      else next[key] = 1;
      return next;
    });
  }

  function changeQuantity(item: CatalogItem, quantity: number) {
    setSelected((current) => ({ ...current, [itemKey(item)]: quantity }));
  }

  function changeRoom(roomId: string) {
    setRoom(roomId);
    // Uma chave só vale para a sala dela: ao trocar de sala, soltamos as chaves das outras.
    setSelected((current) => {
      const next: Record<string, number> = {};
      for (const [key, quantity] of Object.entries(current)) {
        const item = catalog.find((candidate) => itemKey(candidate) === key);
        if (item?.type === "key" && roomId && item.roomId !== roomId) continue;
        next[key] = quantity;
      }
      return next;
    });
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!date || !room || !pickupTime || !returnTime) {
      setError("Preencha data, sala e horários antes de continuar.");
      return;
    }
    if (returnTime <= pickupTime) {
      setError(
        "O horário previsto de devolução deve ser posterior ao horário de retirada.",
      );
      return;
    }
    if (pickupTime < MIN_PICKUP || pickupTime > MAX_PICKUP) {
      setError(`A retirada deve ser entre ${MIN_PICKUP} e ${MAX_PICKUP}.`);
      return;
    }
    if (returnTime > MAX_RETURN) {
      setError(`A devolução deve ocorrer até ${MAX_RETURN}.`);
      return;
    }

    const chosen = catalog.filter((item) => itemKey(item) in selected);
    if (chosen.length === 0) {
      setError("Escolha pelo menos um item na lista para solicitar.");
      return;
    }
    const blocked = chosen.find((item) =>
      unavailableReason(item, room, hasWindow),
    );
    if (blocked) {
      setError(
        `"${blocked.name}" não pode ser solicitado: ${unavailableReason(blocked, room, hasWindow)}. Remova-o para continuar.`,
      );
      return;
    }

    const selectedRoom = rooms.find((option) => option.value === room);
    const draftItems = chosen.map((item) => ({
      type: item.type,
      id: item.id,
      quantity: item.type === "key" ? 1 : selected[itemKey(item)],
    }));

    setError("");
    onReview({
      draft: { roomId: room, date, pickupTime, returnTime, notes, items: draftItems },
      usageDate: date,
      location: selectedRoom?.label ?? room,
      pickupTime,
      returnTime,
      notes,
      items: chosen.map((item, index) => ({
        id: itemKey(item),
        name: item.name,
        category:
          item.type === "key" ? "Chave de laboratório" : "Material acadêmico",
        quantity: draftItems[index].quantity,
        unit: item.type === "key" ? "chave" : "un.",
        description: item.detail ?? undefined,
        withdrawalLocation: "Secretaria CCT · Bloco J-02",
      })),
    });
  }

  return (
    <main className="request-page">
      <AppTopNav
        user={session}
        active="new"
        onHome={onBack}
        onNewRequest={() => undefined}
        onMyRequests={onMyRequests}
        {...navExtras}
      />

      <section className="request-content">
        <div className="request-context">
          <button type="button" onClick={onBack}>
            ← Voltar para o painel inicial
          </button>
          <span>
            <i /> Secretaria CCT · Bloco J-02
          </span>
        </div>

        <header className="request-title">
          <h1>Nova solicitação</h1>
          <p>
            {isStudent
              ? "Informe o período e a sala, e marque na lista as chaves de laboratório que deseja requisitar."
              : "Informe o período e a sala, e marque na lista os materiais e chaves que deseja requisitar."}
          </p>
          <div className="request-info">
            <b>ⓘ</b>
            <div>
              <strong>Análise de liberação institucional</strong>
              <span>
                As solicitações passam pela checagem da Secretaria do Bloco
                J-02. A devolução institucional deve ocorrer até 22h40.
              </span>
            </div>
          </div>
        </header>

        <div className="request-steps" aria-label="Etapas da solicitação">
          <span className="active">
            <b>1</b> Dados de utilização
          </span>
          <i />
          <span>
            <b>2</b> Itens solicitados
          </span>
          <i />
          <span>
            <b>3</b> Confirmação
          </span>
        </div>

        <form className="request-form" onSubmit={submitRequest} noValidate>
          <section className="request-section">
            <header>
              <span>◷</span>
              <div>
                <h2>1. Dados de utilização</h2>
                <p>Defina a alocação e a faixa de horário.</p>
              </div>
              <b>* Campos obrigatórios</b>
            </header>
            <div className="request-fields">
              <label>
                Data de utilização *
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </label>
              <label>
                Sala / local *
                <select
                  value={room}
                  onChange={(event) => changeRoom(event.target.value)}
                >
                  <option value="">Selecione a sala</option>
                  {rooms.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Horário de retirada *
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(event) => setPickupTime(event.target.value)}
                />
              </label>
              <label>
                Horário previsto de devolução *
                <input
                  type="time"
                  value={returnTime}
                  onChange={(event) => setReturnTime(event.target.value)}
                />
              </label>
            </div>
            <label className="request-notes">
              Observações <small>(opcional)</small>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Descreva o propósito da utilização, disciplina ou projeto..."
                rows={3}
              />
            </label>
          </section>

          <section className="request-section">
            <header>
              <span>▣</span>
              <div>
                <h2>2. Itens solicitados</h2>
                <p>
                  {isStudent
                    ? "Alunos autorizados podem solicitar somente chaves de laboratórios."
                    : "Clique nos itens para marcá-los. Você pode escolher vários."}
                </p>
              </div>
            </header>

            {isStudent && options.data?.authorization && (
              <div className="authorization-notice">
                <b>✓</b>
                <div>
                  <strong>Autorização ativa</strong>
                  <span>
                    Projeto: {options.data.authorization.project}
                    {options.data.authorization.responsibleProfessor &&
                      ` · Professor responsável: ${options.data.authorization.responsibleProfessor}`}
                  </span>
                </div>
              </div>
            )}

            {options.loading && <p role="status">Carregando itens…</p>}
            {options.error && (
              <p className="request-error" role="alert">
                ⚠ {options.error}{" "}
                <button type="button" onClick={options.reload}>
                  Tentar de novo
                </button>
              </p>
            )}
            {options.data && (
              <ItemPicker
                items={catalog}
                selected={selected}
                roomId={room}
                hasWindow={hasWindow}
                onToggle={toggleItem}
                onQuantityChange={changeQuantity}
              />
            )}
          </section>

          {error && (
            <p className="request-error" role="alert">
              ⚠ {error}
            </p>
          )}
          <footer className="request-actions">
            <button type="button" className="cancel-request" onClick={onBack}>
              Cancelar
            </button>
            <button type="submit" className="continue-request">
              Revisar e confirmar →
            </button>
          </footer>
        </form>
      </section>
    </main>
  );
}

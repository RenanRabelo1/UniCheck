import { useRef, useState, type FormEvent } from "react";

import {
  createKey,
  createRoom,
  listRoomsAndKeys,
  setKeyActive,
  updateRoom,
  type Room,
  type RoomKey,
  type RoomsAndKeys,
} from "../../../services/rooms";
import { useRequestData } from "../../solicitacoes/useRequestData";
import { errorMessage } from "../operations-api/operations.shared";
import "../rooms-keys-management/rooms-keys-management.css";
import "../requests-api/requestsApi.css";

const keyTypes: Array<{ value: RoomKey["type"]; label: string }> = [
  { value: "primary", label: "Primária" },
  { value: "secondary", label: "Secundária" },
];

function keySituation(key: RoomKey) {
  if (!key.active) return { label: "Inativa", className: "maintenance" };
  return key.inPossession
    ? { label: "Em posse", className: "loaned" }
    : { label: "Disponível", className: "available" };
}

/** Tela 14 conectada: o código da chave é gerado pelo servidor; salas e chaves só são inativadas. */
export function RoomsKeysApi() {
  const { data, loading, error, retry } = useRequestData(listRoomsAndKeys);
  // Ficam aqui: recarregar a lista desmonta o conteúdo, e a confirmação e a sala escolhida precisam continuar.
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");

  return (
    <section
      className="rooms-keys-management"
      aria-labelledby="rooms-keys-title"
    >
      <header className="rooms-keys-management__header">
        <div>
          <p className="rooms-keys-management__eyebrow">Administração</p>
          <h1 id="rooms-keys-title">Salas e chaves</h1>
          <p>Cadastre as salas e acompanhe a situação de cada chave.</p>
        </div>
        <button
          className="admin-api-button"
          type="button"
          onClick={retry}
          disabled={loading}
        >
          Atualizar
        </button>
      </header>

      {notice && (
        <p className="rooms-keys-management__notice" role="status">
          {notice}
        </p>
      )}
      {loading && <p role="status">Carregando salas e chaves…</p>}
      {error && (
        <div className="admin-api-error" role="alert">
          <p>{error}</p>
          <button className="admin-api-button" type="button" onClick={retry}>
            Tentar novamente
          </button>
        </div>
      )}
      {data && (
        <RoomsKeysContent
          data={data}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNotice={setNotice}
          onChanged={retry}
        />
      )}
    </section>
  );
}

function RoomsKeysContent({
  data,
  selectedId,
  onSelect,
  onNotice,
  onChanged,
}: {
  data: RoomsAndKeys;
  selectedId: string;
  onSelect: (id: string) => void;
  onNotice: (message: string) => void;
  onChanged: () => void;
}) {
  const { rooms, keys } = data;
  const [draft, setDraft] = useState({ code: "", name: "" });
  const [problem, setProblem] = useState("");
  const [saving, setSaving] = useState(false);
  const locked = useRef(false);

  const selected = rooms.find((room) => room.id === selectedId) ?? rooms[0];
  const roomKeys = keys.filter((key) => key.room.value === selected?.id);
  const missingTypes = keyTypes.filter(
    (type) => !roomKeys.some((key) => key.type === type.value),
  );

  async function run(action: () => Promise<string>, fallback: string) {
    if (locked.current) return;
    locked.current = true;
    setSaving(true);
    onNotice("");
    setProblem("");
    try {
      onNotice(await action());
      onChanged();
    } catch (cause) {
      setProblem(errorMessage(cause, fallback));
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }

  function submitRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      const room = await createRoom({
        code: draft.code.trim(),
        name: draft.name.trim(),
      });
      setDraft({ code: "", name: "" });
      onSelect(room.id);
      return `Sala ${room.code} cadastrada.`;
    }, "Não foi possível cadastrar a sala.");
  }

  const toggleRoom = (room: Room) =>
    run(async () => {
      await updateRoom(room.id, { active: !room.active });
      return `Sala ${room.code} ${room.active ? "inativada" : "reativada"}.`;
    }, "Não foi possível alterar a sala.");

  const toggleKey = (key: RoomKey) =>
    run(async () => {
      await setKeyActive(key.id, !key.active);
      return `Chave ${key.typeLabel.toLowerCase()} ${key.active ? "inativada" : "reativada"}.`;
    }, "Não foi possível alterar a chave.");

  const addKey = (room: Room, type: RoomKey["type"]) =>
    run(async () => {
      const key = await createKey({ roomId: room.id, type });
      return `Chave ${key.typeLabel.toLowerCase()} cadastrada em ${room.code}.`;
    }, "Não foi possível cadastrar a chave.");

  return (
    <>
      {problem && (
        <p className="admin-api-error" role="alert">
          {problem}
        </p>
      )}

      <div className="rooms-keys-management__grid">
        <article className="rooms-keys-management__panel">
          <div className="rooms-keys-management__panel-heading">
            <h2>Visão por salas</h2>
            <span>{rooms.length} cadastradas</span>
          </div>
          <div className="rooms-keys-management__room-list">
            {rooms.map((room) => (
              <button
                className={room.id === selected?.id ? "is-selected" : ""}
                key={room.id}
                onClick={() => onSelect(room.id)}
                type="button"
              >
                <strong>{room.code}</strong>
                <span>{room.name}</span>
                <small>{room.active ? "Ativa" : "Inativa"}</small>
              </button>
            ))}
          </div>
        </article>

        {selected && (
          <article className="rooms-keys-management__panel rooms-keys-management__room-detail">
            <div className="rooms-keys-management__panel-heading">
              <h2>Detalhes da sala</h2>
              <span>{roomKeys.length} chave(s)</span>
            </div>
            <h3>
              {selected.code} · {selected.name}
            </h3>
            <ul aria-label={`Chaves de ${selected.name}`}>
              {roomKeys.map((key) => {
                const situation = keySituation(key);
                return (
                  <li key={key.id}>
                    <span>{key.typeLabel}</span>
                    <span
                      className={`rooms-keys-management__status rooms-keys-management__status--${situation.className}`}
                    >
                      {situation.label}
                    </span>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void toggleKey(key)}
                    >
                      {key.active ? "Inativar chave" : "Reativar chave"}
                    </button>
                  </li>
                );
              })}
              {roomKeys.length === 0 && <li>Nenhuma chave cadastrada.</li>}
            </ul>
            {missingTypes.length === 0 && (
              <p>Esta sala já tem chave primária e secundária.</p>
            )}
            {selected.active &&
              missingTypes.map((type) => (
                <p key={type.value}>
                  Falta a chave {type.label.toLowerCase()}.{" "}
                  <button
                    className="admin-api-button"
                    type="button"
                    disabled={saving}
                    onClick={() => void addKey(selected, type.value)}
                  >
                    Cadastrar chave
                  </button>
                </p>
              ))}
            <button
              className="admin-api-button"
              type="button"
              disabled={saving}
              onClick={() => void toggleRoom(selected)}
            >
              {selected.active ? "Inativar sala" : "Reativar sala"}
            </button>
          </article>
        )}

        <form
          className="rooms-keys-management__panel rooms-keys-management__form"
          onSubmit={submitRoom}
        >
          <h2>Criar sala</h2>
          <label>
            Código da sala
            <input
              required
              value={draft.code}
              onChange={(event) =>
                setDraft({ ...draft, code: event.target.value })
              }
            />
          </label>
          <label>
            Nome da sala
            <input
              required
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
          </label>
          <button type="submit" disabled={saving}>
            Cadastrar sala
          </button>
        </form>
      </div>
    </>
  );
}

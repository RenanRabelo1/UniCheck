import { FormEvent, useMemo, useState } from 'react';
import { physicalKeysMock, roomsMock } from './rooms-keys-management.mock';
import type {
  KeyDraft,
  KeyStatus,
  PhysicalKey,
  Room,
  RoomDraft,
  RoomsKeysManagementProps,
} from './rooms-keys-management.types';
import './rooms-keys-management.css';

const emptyRoom: RoomDraft = { code: '', name: '', floor: '' };
const emptyKey: KeyDraft = { code: '', roomId: '', kind: 'PRIMARY' };

const statusLabel: Record<KeyStatus, string> = {
  AVAILABLE: 'Disponível',
  LOANED: 'Em retirada',
  MAINTENANCE: 'Em manutenção',
};

const kindLabel: Record<PhysicalKey['kind'], string> = {
  PRIMARY: 'Primária',
  SECONDARY: 'Secundária',
};

export function RoomsKeysManagement({
  onDemoWithdrawal,
  onDemonstrationChange,
}: RoomsKeysManagementProps) {
  const [rooms, setRooms] = useState<Room[]>(roomsMock);
  const [keys, setKeys] = useState<PhysicalKey[]>(physicalKeysMock);
  const [selectedRoomId, setSelectedRoomId] = useState(roomsMock[0].id);
  const [selectedKeyId, setSelectedKeyId] = useState(physicalKeysMock[0].id);
  const [roomDraft, setRoomDraft] = useState<RoomDraft>(emptyRoom);
  const [keyDraft, setKeyDraft] = useState<KeyDraft>(emptyKey);
  const [notice, setNotice] = useState('Dados demonstrativos: nenhuma alteração é persistida.');

  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? rooms[0];
  const selectedKey = keys.find((key) => key.id === selectedKeyId) ?? keys[0];
  const roomKeys = useMemo(
    () => keys.filter((key) => key.roomId === selectedRoom?.id),
    [keys, selectedRoom?.id],
  );

  const showNotice = (message: string) => {
    setNotice(message);
    onDemonstrationChange?.(message);
  };

  const createRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomDraft.code.trim() || !roomDraft.name.trim() || !roomDraft.floor.trim()) return;

    const room: Room = {
      id: `room-demo-${rooms.length + 1}`,
      code: roomDraft.code.trim().toUpperCase(),
      name: roomDraft.name.trim(),
      floor: roomDraft.floor.trim(),
      description: 'Sala criada apenas para demonstração local.',
    };
    setRooms((current) => [...current, room]);
    setSelectedRoomId(room.id);
    setRoomDraft(emptyRoom);
    showNotice(`Sala ${room.code} adicionada à demonstração local.`);
  };

  const createKey = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!keyDraft.code.trim() || !keyDraft.roomId) return;

    const key: PhysicalKey = {
      id: `key-demo-${keys.length + 1}`,
      code: keyDraft.code.trim().toUpperCase(),
      roomId: keyDraft.roomId,
      kind: keyDraft.kind,
      status: 'AVAILABLE',
      hasHistory: false,
    };
    setKeys((current) => [...current, key]);
    setSelectedKeyId(key.id);
    setKeyDraft(emptyKey);
    showNotice(`Chave ${key.code} cadastrada apenas nesta demonstração.`);
  };

  const updateKeySituation = () => {
    if (!selectedKey) return;
    const nextStatus: KeyStatus = selectedKey.status === 'AVAILABLE' ? 'LOANED' : 'AVAILABLE';
    const updatedKey: PhysicalKey = {
      ...selectedKey,
      status: nextStatus,
      holder: nextStatus === 'LOANED' ? 'Retirada demonstrativa' : undefined,
    };
    setKeys((current) => current.map((key) => (key.id === updatedKey.id ? updatedKey : key)));
    if (nextStatus === 'LOANED') onDemoWithdrawal?.(updatedKey);
    showNotice(`${updatedKey.code}: situação alterada somente na demonstração.`);
  };

  return (
    <section className="rooms-keys-management" aria-labelledby="rooms-keys-title">
      <header className="rooms-keys-management__header">
        <div>
          <p className="rooms-keys-management__eyebrow">Administração</p>
          <h1 id="rooms-keys-title">Salas e chaves</h1>
          <p>Gerencie visualmente o catálogo físico e o claviculário.</p>
        </div>
        <span className="rooms-keys-management__demo-badge">Modo demonstrativo</span>
      </header>

      <p className="rooms-keys-management__notice" role="status">{notice}</p>

      <div className="rooms-keys-management__grid">
        <article className="rooms-keys-management__panel">
          <div className="rooms-keys-management__panel-heading">
            <h2>Visão por salas</h2>
            <span>{rooms.length} cadastradas</span>
          </div>
          <div className="rooms-keys-management__room-list">
            {rooms.map((room) => (
              <button
                className={room.id === selectedRoom?.id ? 'is-selected' : ''}
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                type="button"
              >
                <strong>{room.code}</strong>
                <span>{room.name}</span>
                <small>{room.floor}</small>
              </button>
            ))}
          </div>
        </article>

        {selectedRoom && (
          <article className="rooms-keys-management__panel rooms-keys-management__room-detail">
            <div className="rooms-keys-management__panel-heading">
              <h2>Detalhes da sala</h2>
              <span>{roomKeys.length} chave(s)</span>
            </div>
            <h3>{selectedRoom.code} · {selectedRoom.name}</h3>
            <p>{selectedRoom.description}</p>
            <p><strong>Localização:</strong> {selectedRoom.floor}</p>
            <ul aria-label={`Chaves de ${selectedRoom.name}`}>
              {roomKeys.length ? roomKeys.map((key) => (
                <li key={key.id}>
                  <button onClick={() => setSelectedKeyId(key.id)} type="button">{key.code}</button>
                  <span className={`rooms-keys-management__status rooms-keys-management__status--${key.status.toLowerCase()}`}>
                    {statusLabel[key.status]}
                  </span>
                </li>
              )) : <li>Nenhuma chave demonstrativa vinculada.</li>}
            </ul>
          </article>
        )}

        <form className="rooms-keys-management__panel rooms-keys-management__form" onSubmit={createRoom}>
          <h2>Criar sala</h2>
          <label>Código<input onChange={(event) => setRoomDraft({ ...roomDraft, code: event.target.value })} required value={roomDraft.code} /></label>
          <label>Nome<input onChange={(event) => setRoomDraft({ ...roomDraft, name: event.target.value })} required value={roomDraft.name} /></label>
          <label>Localização<input onChange={(event) => setRoomDraft({ ...roomDraft, floor: event.target.value })} required value={roomDraft.floor} /></label>
          <button type="submit">Adicionar demonstração</button>
        </form>
      </div>

      <section className="rooms-keys-management__catalog" aria-labelledby="key-catalog-title">
        <div className="rooms-keys-management__panel-heading">
          <div><p className="rooms-keys-management__eyebrow">Claviculário</p><h2 id="key-catalog-title">Catálogo de chaves físicas</h2></div>
          <span>{keys.length} chaves</span>
        </div>
        <div className="rooms-keys-management__catalog-grid">
          <div className="rooms-keys-management__key-list">
            {keys.map((key) => {
              const room = rooms.find((item) => item.id === key.roomId);
              return (
                <button className={key.id === selectedKey?.id ? 'is-selected' : ''} key={key.id} onClick={() => setSelectedKeyId(key.id)} type="button">
                  <strong>{key.code}</strong><span>{room?.code ?? 'Sala não encontrada'} · {kindLabel[key.kind]}</span>
                  <small className={`rooms-keys-management__status rooms-keys-management__status--${key.status.toLowerCase()}`}>{statusLabel[key.status]}</small>
                </button>
              );
            })}
          </div>

          {selectedKey && (
            <aside className="rooms-keys-management__key-detail" aria-label="Situação da chave selecionada">
              <p className="rooms-keys-management__eyebrow">Chave selecionada</p>
              <h3>{selectedKey.code}</h3>
              <p>{kindLabel[selectedKey.kind]} · {rooms.find((room) => room.id === selectedKey.roomId)?.name}</p>
              <p><strong>Situação:</strong> {statusLabel[selectedKey.status]}</p>
              {selectedKey.holder && <p><strong>Responsável:</strong> {selectedKey.holder}</p>}
              <p className="rooms-keys-management__history-note">
                {selectedKey.hasHistory ? 'Esta chave possui histórico e não pode ser apagada.' : 'Sem histórico no mock; exclusão não é oferecida nesta tela.'}
              </p>
              <button disabled={selectedKey.status === 'MAINTENANCE'} onClick={updateKeySituation} type="button">
                {selectedKey.status === 'AVAILABLE' ? 'Simular retirada' : 'Simular devolução'}
              </button>
              <button className="rooms-keys-management__link-button" onClick={() => showNotice(`Atalho demonstrativo aberto para a retirada de ${selectedKey.code}.`)} type="button">
                Ir para retirada demonstrativa
              </button>
            </aside>
          )}

          <form className="rooms-keys-management__form" onSubmit={createKey}>
            <h3>Cadastrar chave física</h3>
            <label>Código<input onChange={(event) => setKeyDraft({ ...keyDraft, code: event.target.value })} required value={keyDraft.code} /></label>
            <label>Sala<select onChange={(event) => setKeyDraft({ ...keyDraft, roomId: event.target.value })} required value={keyDraft.roomId}><option value="">Selecione</option>{rooms.map((room) => <option key={room.id} value={room.id}>{room.code} · {room.name}</option>)}</select></label>
            <label>Tipo<select onChange={(event) => setKeyDraft({ ...keyDraft, kind: event.target.value as PhysicalKey['kind'] })} value={keyDraft.kind}><option value="PRIMARY">Primária</option><option value="SECONDARY">Secundária</option></select></label>
            <button type="submit">Cadastrar demonstração</button>
          </form>
        </div>
      </section>
    </section>
  );
}

export default RoomsKeysManagement;

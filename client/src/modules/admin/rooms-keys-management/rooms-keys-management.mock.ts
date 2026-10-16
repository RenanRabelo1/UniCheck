import type { PhysicalKey, Room } from './rooms-keys-management.types';

export const roomsMock: Room[] = [
  {
    id: 'room-lab-101',
    code: 'LAB-101',
    name: 'Laboratório de Redes',
    floor: '1º andar',
    description: 'Bancadas para atividades práticas de redes.',
  },
  {
    id: 'room-sala-204',
    code: 'SALA-204',
    name: 'Sala de Projetos',
    floor: '2º andar',
    description: 'Sala reservada para encontros de projetos.',
  },
  {
    id: 'room-auditorio',
    code: 'AUD-01',
    name: 'Auditório',
    floor: 'Térreo',
    description: 'Espaço para palestras e atividades institucionais.',
  },
];

export const physicalKeysMock: PhysicalKey[] = [
  {
    id: 'key-001',
    code: 'CH-001',
    roomId: 'room-lab-101',
    kind: 'PRIMARY',
    status: 'AVAILABLE',
    hasHistory: true,
  },
  {
    id: 'key-002',
    code: 'CH-002',
    roomId: 'room-lab-101',
    kind: 'SECONDARY',
    status: 'LOANED',
    holder: 'Ana Souza',
    hasHistory: true,
  },
  {
    id: 'key-003',
    code: 'CH-003',
    roomId: 'room-sala-204',
    kind: 'PRIMARY',
    status: 'MAINTENANCE',
    hasHistory: false,
  },
  {
    id: 'key-004',
    code: 'CH-004',
    roomId: 'room-auditorio',
    kind: 'PRIMARY',
    status: 'AVAILABLE',
    hasHistory: true,
  },
];

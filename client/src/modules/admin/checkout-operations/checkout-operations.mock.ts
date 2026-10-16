import type {
  ApprovedCheckoutRequest,
  CheckoutCoordinator,
} from './checkout-operations.types';

export const approvedCheckoutRequests: ApprovedCheckoutRequest[] = [
  {
    id: 'request-2026-001',
    protocol: 'SOL-2026-00418',
    requestedAt: '16/10/2026',
    applicant: {
      name: 'Mariana Alves Costa',
      registration: '23104567',
      email: 'mariana.costa@unifor.br',
      phone: '(85) 98888-1204',
      role: 'Professora',
    },
    approvedItems: [
      {
        id: 'material-1',
        name: 'Projetor Epson EB-X49',
        kind: 'MATERIAL',
        identifier: 'PAT-009842',
        details: 'Acompanha cabo HDMI e controle remoto.',
      },
      {
        id: 'key-1',
        name: 'Chave da sala S-12',
        kind: 'CHAVE',
        identifier: 'CH-S12-01',
        details: 'Chave física primária.',
      },
    ],
  },
  {
    id: 'request-2026-002',
    protocol: 'SOL-2026-00423',
    requestedAt: '15/10/2026',
    applicant: {
      name: 'Lucas Pereira Lima',
      registration: '24107892',
      email: 'lucas.lima@edu.unifor.br',
      phone: '(85) 98765-4412',
      role: 'Aluno',
      project: 'Laboratório de Robótica Educacional',
    },
    approvedItems: [
      {
        id: 'material-2',
        name: 'Kit Arduino Uno',
        kind: 'MATERIAL',
        identifier: 'PAT-006731',
        details: 'Kit com placa, cabo USB e protoboard.',
      },
    ],
  },
];

export const checkoutCoordinators: CheckoutCoordinator[] = [
  { id: 'coordinator-1', name: 'Ana Beatriz Martins', registration: 'COORD-101' },
  { id: 'coordinator-2', name: 'Rafael Monteiro', registration: 'COORD-114' },
];

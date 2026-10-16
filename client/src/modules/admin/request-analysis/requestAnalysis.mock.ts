import type { RequestAnalysisRequest } from './types';

export const requestAnalysisMock: RequestAnalysisRequest = {
  protocol: 'SOL-2026-00158',
  requestedAt: '16/10/2026, 09:30',
  purpose: 'Aula prática de Instrumentação Industrial',
  returnDeadline: '16/10/2026, 22:40',
  requester: {
    name: 'Prof. Marina Albuquerque',
    role: 'Professora',
    registration: '00642817',
    email: 'marina.albuquerque@unifor.br',
    phone: '(85) 99999-2014',
  },
  items: [
    {
      id: 'material-multimetro',
      name: 'Multímetro digital',
      description: 'Patrimônio: CCT-0198',
      requestedQuantity: 2,
      availableQuantity: 4,
      availabilityLabel: 'Disponível',
    },
    {
      id: 'material-osciloscopio',
      name: 'Osciloscópio portátil',
      description: 'Patrimônio: CCT-0321',
      requestedQuantity: 1,
      availableQuantity: 0,
      availabilityLabel: 'Indisponível',
    },
    {
      id: 'material-cabo',
      name: 'Kit de cabos banana',
      description: 'Estoque compartilhado do laboratório',
      requestedQuantity: 6,
      availableQuantity: 12,
      availabilityLabel: 'Disponível',
    },
  ],
};

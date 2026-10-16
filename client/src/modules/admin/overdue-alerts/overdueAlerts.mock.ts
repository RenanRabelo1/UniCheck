import type { OverdueAlert } from './overdueAlerts.types';

/** Dados locais para demonstrar a tela sem integração com serviços. */
export const overdueAlertsMock: OverdueAlert[] = [
  {
    id: 'alerta-001',
    code: 'CH-2.14',
    itemName: 'Chave do laboratório 2.14',
    type: 'Chave',
    borrower: 'Larissa Monteiro',
    link: 'Projeto Robótica Aplicada',
    dueAt: '15 out., 22:40',
    delayLabel: '1 dia em atraso',
    status: 'Pendente',
  },
  {
    id: 'alerta-002',
    code: 'MAT-048',
    itemName: 'Kit multímetro digital',
    type: 'Material',
    borrower: 'Rafael Costa',
    link: 'Professor de Circuitos',
    dueAt: '13 out., 22:40',
    delayLabel: '3 dias em atraso',
    status: 'Em contato',
  },
  {
    id: 'alerta-003',
    code: 'CH-1.06',
    itemName: 'Chave da sala 1.06',
    type: 'Chave',
    borrower: 'Marina Alves',
    link: 'Aluno de Engenharia',
    dueAt: '09 out., 22:40',
    delayLabel: '7 dias em atraso',
    status: 'Pendente',
  },
  {
    id: 'alerta-004',
    code: 'MAT-121',
    itemName: 'Projetor portátil',
    type: 'Material',
    borrower: 'Diego Nascimento',
    link: 'Projeto Inovação CCT',
    dueAt: '02 out., 22:40',
    delayLabel: '14 dias em atraso',
    status: 'Pendente',
  },
];

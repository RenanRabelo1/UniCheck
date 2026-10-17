export type OverdueItemType = 'Chave' | 'Material';

export interface OverdueAlert {
  id: string;
  code: string;
  itemName: string;
  type: OverdueItemType;
  borrower: string;
  link: string;
  dueAt: string;
  delayLabel: string;
  status: 'Pendente' | 'Em contato';
}

export interface OverdueAlertFilters {
  period: 'Hoje' | '7 dias' | '30 dias' | 'Todos';
  type: 'Todos' | OverdueItemType;
  link: 'Todos' | 'Aluno' | 'Professor' | 'Projeto';
}

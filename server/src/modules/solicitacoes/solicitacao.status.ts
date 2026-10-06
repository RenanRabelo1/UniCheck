import type { StatusItem } from '../../database/types.js'

// Agrupamentos de status usados pelo painel. Centralizados para evitar textos soltos.
export const STATUS_PENDENTES: StatusItem[] = ['PENDENTE']
export const STATUS_APROVADOS: StatusItem[] = ['APROVADO', 'RESERVADO']
export const STATUS_EM_POSSE: StatusItem[] = ['RETIRADO', 'ATRASADO']

// Status em que o item "segura" o estoque ou a chave. Pendente ainda não segura:
// só passa a valer quando o coordenador aprova.
export const STATUS_QUE_OCUPAM: StatusItem[] = [...STATUS_APROVADOS, ...STATUS_EM_POSSE]

export const ROTULO_STATUS: Record<StatusItem, string> = {
  PENDENTE: 'Pendente',
  APROVADO: 'Aprovado',
  RESERVADO: 'Reservado',
  RETIRADO: 'Em posse',
  DEVOLVIDO: 'Devolvido',
  RECUSADO: 'Recusado',
  ATRASADO: 'Em atraso',
}

// Lista completa, usada para validar o filtro `status` das rotas administrativas.
export const TODOS_STATUS = [
  'PENDENTE',
  'APROVADO',
  'RESERVADO',
  'RETIRADO',
  'DEVOLVIDO',
  'RECUSADO',
  'ATRASADO',
] as const satisfies readonly StatusItem[]

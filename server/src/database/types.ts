export type Perfil = 'PROFESSOR' | 'ALUNO' | 'COORDENADOR' | 'FUNCIONARIO'

export type TipoItem = 'MATERIAL' | 'CHAVE'

export type TipoChave = 'PRIMARIA' | 'SECUNDARIA'

export type StatusItem =
  | 'PENDENTE'
  | 'APROVADO'
  | 'RESERVADO'
  | 'RETIRADO'
  | 'DEVOLVIDO'
  | 'RECUSADO'
  | 'ATRASADO'

export interface AutorizacaoAluno {
  projeto: string
  professorResponsavelId: string
}

export interface Usuario {
  id: string
  nome: string
  /** Valor digitado no login: matrícula (professor/coordenador) ou e-mail (aluno). */
  identificador: string
  /** Texto exibido no painel (ex.: 2048819/CCT). */
  matricula: string
  perfil: Perfil
  /** Aluno com autorização ativa para solicitar chaves. */
  autorizado: boolean
  /** Projeto e professor responsável do aluno autorizado. */
  autorizacao?: AutorizacaoAluno
  ativo: boolean
  senhaHash: string
}

export interface Sala {
  id: string
  /** Código curto exibido na tela (ex.: J-201). */
  codigo: string
  nome: string
  /** Salas, como materiais e chaves, são inativadas e nunca removidas. */
  ativo: boolean
}

export interface Material {
  id: string
  nome: string
  /** Informação extra exibida na tela, como patrimônio ou bancada. */
  detalhe?: string
  quantidadeTotal: number
  /** Materiais são inativados, nunca removidos (regra do docs). */
  ativo: boolean
}

export interface Chave {
  id: string
  salaId: string
  tipo: TipoChave
  ativo: boolean
}

export interface ItemSolicitacao {
  id: string
  tipo: TipoItem
  /** Id do material ou da chave pedida. */
  referenciaId: string
  /** Nome no momento do pedido: o histórico não muda se o cadastro for renomeado. */
  nome: string
  detalhe?: string
  quantidade: number
  status: StatusItem
  /** Momento da última mudança de status (aprovação, retirada, devolução...). */
  atualizadoEm: string
  motivoRecusa?: string
  /** Quem aprovou ou recusou o item. */
  decididoPorId?: string
}

export interface Solicitacao {
  id: string
  usuarioId: string
  criadoEm: string
  salaId: string
  /** AAAA-MM-DD */
  dataUtilizacao: string
  /** HH:mm */
  retiradaPrevista: string
  /** HH:mm */
  devolucaoPrevista: string
  observacoes?: string
  itens: ItemSolicitacao[]
}

export type TipoMovimentacao = 'RETIRADA' | 'DEVOLUCAO'

/** Registro presencial feito pela Secretaria. Serve de histórico de uso. */
export interface Movimentacao {
  id: string
  tipo: TipoMovimentacao
  solicitacaoId: string
  itemId: string
  /** Nome do item no momento do registro (o histórico não muda com o cadastro). */
  itemNome: string
  registradoPorId: string
  /** Quem de fato retirou ou devolveu o item. */
  responsavel: string
  registradoEm: string
  observacao?: string
}

/** Alerta gerado quando um item não é devolvido até 22:40. */
export interface Alerta {
  id: string
  solicitacaoId: string
  itemId: string
  itemNome: string
  usuarioId: string
  criadoEm: string
  /** Preenchido quando o item é devolvido. */
  resolvidoEm?: string
}

export interface Database {
  usuarios: Usuario[]
  salas: Sala[]
  materiais: Material[]
  chaves: Chave[]
  solicitacoes: Solicitacao[]
  movimentacoes: Movimentacao[]
  alertas: Alerta[]
}

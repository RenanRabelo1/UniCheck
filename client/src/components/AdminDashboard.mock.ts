import type {
  AdminAction,
  AdminDashboardDemoCopy,
  AdminMetric,
  AdminMovement,
  AdminQuickAction,
} from "./AdminDashboard.types";

export const adminDashboardDemoCopy: AdminDashboardDemoCopy = {
  dateLabel: "Quarta-feira, 24 de setembro de 2026",
  shiftLabel: "Turno diurno (07h30 — 21h00)",
  activeFlowsLabel: "6 fluxos demonstrativos",
  activeRequestsLabel:
    "Exibindo 4 de 12 solicitações demonstrativas no turno atual",
  initialFeedback:
    "Painel em modo demonstrativo. Nenhuma ação desta tela altera solicitações, inventário ou registros de atendimento.",
};

export const adminDemoActionLabels: Record<AdminAction, string> = {
  "review-requests": "A fila de solicitações seria aberta para análise",
  "register-pickup": "O fluxo de retirada seria aberto",
  "register-return": "O fluxo de devolução seria aberto",
  "manage-inventory": "A consulta de materiais e chaves seria aberta",
  "authorized-users": "A lista de usuários autorizados seria aberta",
  reports: "A área de relatórios seria aberta",
  requests: "A listagem de solicitações seria aberta",
  operations: "A área de retiradas e devoluções seria aberta",
  inventory: "O inventário seria aberto",
  refresh: "Os indicadores demonstrativos seriam atualizados",
};

export const adminMetricsMock: AdminMetric[] = [
  {
    id: "pending",
    label: "Solicitações pendentes",
    value: 12,
    badge: "+3 hoje",
    description: "Aguardando análise da coordenação.",
    footer: "Revisar fila",
    icon: "pending",
    tone: "primary",
  },
  {
    id: "approved",
    label: "Itens aprovados",
    value: 8,
    badge: "No balcão",
    description: "Liberados para retirada na secretaria.",
    footer: "Prontos no guichê",
    icon: "check",
    tone: "primary",
  },
  {
    id: "checked-out",
    label: "Itens retirados",
    value: 15,
    badge: "Em custódia",
    description: "Em posse física dos solicitantes.",
    footer: "11 chaves • 4 projetores",
    icon: "key",
    tone: "secondary",
  },
  {
    id: "returns",
    label: "Devoluções pendentes",
    value: 6,
    badge: "Atenção",
    description: "Aguardando devolução à secretaria.",
    footer: "2 com prazo às 21h00",
    icon: "return",
    tone: "warning",
  },
];

export const adminQuickActionsMock: AdminQuickAction[] = [
  {
    id: "review-requests",
    label: "Analisar solicitações",
    description:
      "Verificar pedidos pendentes e emitir parecer ou autorização prévia.",
    icon: "check",
  },
  {
    id: "register-pickup",
    label: "Registrar retirada",
    description:
      "Confirmar entrega física de chaves ou equipamentos no guichê.",
    icon: "arrow",
  },
  {
    id: "register-return",
    label: "Registrar devolução",
    description:
      "Receber material, conferir integridade e dar baixa na custódia.",
    icon: "return",
  },
  {
    id: "manage-inventory",
    label: "Materiais e chaves",
    description:
      "Consultar inventário, disponibilidade e status de salas do Bloco J.",
    icon: "inventory",
  },
  {
    id: "authorized-users",
    label: "Usuários autorizados",
    description: "Listagem de alunos vinculados a projetos e docentes do CCT.",
    icon: "badge",
  },
  {
    id: "reports",
    label: "Gerar relatório",
    description:
      "Exportar histórico de empréstimos, termos de custódia e auditoria.",
    icon: "analytics",
  },
];

export const adminMovementsMock: AdminMovement[] = [
  {
    id: "#CCT-2026-0148",
    requester: "Ana Silva",
    requesterRole: "Docente • Engenharia Civil",
    item: "Projetor Epson + Cabo HDMI",
    itemKind: "equipment",
    date: "24/09/2026",
    time: "09:15",
    status: "Pendente",
  },
  {
    id: "#CCT-2026-0147",
    requester: "João Lima",
    requesterRole: "Aluno • LITES (Bolsista)",
    item: "Chave Laboratório J-02",
    itemKind: "key",
    date: "24/09/2026",
    time: "08:30",
    status: "Aprovada",
  },
  {
    id: "#CCT-2026-0145",
    requester: "Carlos Eduardo",
    requesterRole: "Professor CCT • Computação",
    item: "Chave Sala de Reunião J-204",
    itemKind: "key",
    date: "24/09/2026",
    time: "07:45",
    status: "Em uso",
  },
  {
    id: "#CCT-2026-0142",
    requester: "Maria Costa",
    requesterRole: "Monitoria • Física Experimental",
    item: "Pincéis recarregáveis (2) + Apagador",
    itemKind: "material",
    date: "23/09/2026",
    time: "17:40",
    status: "Devolvida",
  },
];

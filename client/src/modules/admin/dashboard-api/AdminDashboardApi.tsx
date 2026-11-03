import { AdminDashboard } from "../../../components/AdminDashboard";
import type {
  AdminAction,
  AdminMetric,
  AdminMovement,
  AdminQuickAction,
  AdminSession,
} from "../../../components/AdminDashboard.types";
import {
  getAdminDashboard,
  type AdminDashboardData,
} from "../../../services/adminDashboard";
import { useRequestData } from "../../solicitacoes/useRequestData";
import { formatRequestDate } from "../requests-api/format";

const quickActions: AdminQuickAction[] = [
  {
    id: "review-requests",
    label: "Analisar solicitações",
    description: "Aprovar ou recusar cada item dos pedidos pendentes.",
    icon: "check",
  },
  {
    id: "register-pickup",
    label: "Registrar retirada",
    description: "Confirmar a entrega física de itens aprovados.",
    icon: "arrow",
  },
  {
    id: "register-return",
    label: "Registrar devolução",
    description: "Receber o item e dar baixa na custódia.",
    icon: "return",
  },
  {
    id: "alerts",
    label: "Alertas de atraso",
    description: "Acompanhar itens não devolvidos até as 22:40.",
    icon: "alert",
  },
  {
    id: "manage-inventory",
    label: "Materiais",
    description: "Consultar e manter o cadastro de materiais.",
    icon: "inventory",
  },
  {
    id: "rooms-keys",
    label: "Salas e chaves",
    description: "Consultar e manter salas e chaves.",
    icon: "key",
  },
  {
    id: "authorized-users",
    label: "Usuários autorizados",
    description: "Gerenciar alunos autorizados e projetos.",
    icon: "badge",
  },
  {
    id: "reports",
    label: "Histórico",
    description: "Consultar as movimentações registradas.",
    icon: "analytics",
  },
];

function toMetrics({ summary }: AdminDashboardData): AdminMetric[] {
  return [
    {
      id: "pending",
      label: "Itens aguardando análise",
      value: summary.pendingItems,
      badge: "",
      description: "Aguardando decisão da coordenação.",
      footer: "Revisar fila",
      icon: "pending",
      tone: "primary",
    },
    {
      id: "approved",
      label: "Aprovados para retirada",
      value: summary.approvedItems,
      badge: "",
      description: "Liberados para retirada na secretaria.",
      footer: "Registrar retirada",
      icon: "check",
      tone: "primary",
    },
    {
      id: "checked-out",
      label: "Itens retirados",
      value: summary.withdrawnItems,
      badge: "",
      description: "Em posse dos solicitantes agora.",
      footer: "Ver itens em posse",
      icon: "key",
      tone: "secondary",
    },
    {
      id: "returns",
      label: "Devoluções pendentes",
      value: summary.pendingReturns,
      badge: "",
      description: "Em posse com o horário previsto vencido.",
      footer: "Registrar devolução",
      icon: "return",
      tone: "warning",
    },
    {
      id: "alerts",
      label: "Alertas de atraso",
      value: summary.openAlerts,
      badge: "",
      description: "Não devolvidos até as 22:40.",
      footer: "Ver alertas",
      icon: "alert",
      tone: "warning",
    },
  ];
}

function toMovements({ recentRequests }: AdminDashboardData): AdminMovement[] {
  return recentRequests.map((request) => ({
    id: request.id,
    protocol: request.protocol,
    requester: request.requester ?? "Solicitante não encontrado",
    requesterRole: request.requesterRole ?? "",
    item: request.items.join(", "),
    itemKind: "material",
    date: formatRequestDate(request.date),
    time: `${request.pickupTime} – ${request.returnTime}`,
    status: request.statusLabel,
  }));
}

const todayLabel = () =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: "America/Fortaleza",
  }).format(new Date());

type Props = {
  session: AdminSession;
  onLogout: () => void;
  onAction: (action: AdminAction) => void;
  onViewRequest: (requestId: string) => void;
};

/** Tela 7 conectada: a mesma tela do painel, sem nada que não venha do servidor. */
export function AdminDashboardApi(props: Props) {
  const { data, loading, error, retry } = useRequestData(getAdminDashboard);

  return (
    <AdminDashboard
      {...props}
      live={{
        metrics: data ? toMetrics(data) : [],
        quickActions,
        movements: data ? toMovements(data) : [],
        dateLabel: todayLabel(),
        loading,
        error,
        onRefresh: retry,
      }}
    />
  );
}

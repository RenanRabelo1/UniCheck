export type AdminSession = {
  name: string;
  registration: string;
  role: "coordinator" | "employee";
  roleLabel: string;
  location?: string;
};

export type AdminAction =
  | "review-requests"
  | "register-pickup"
  | "register-return"
  | "manage-inventory"
  | "authorized-users"
  | "reports"
  | "requests"
  | "operations"
  | "inventory"
  | "rooms-keys"
  | "alerts"
  | "refresh";

export type AdminMetric = {
  id: "pending" | "approved" | "checked-out" | "returns" | "alerts";
  label: string;
  value: number;
  badge: string;
  description: string;
  footer: string;
  icon: AdminIconName;
  tone: "primary" | "secondary" | "warning";
};

export type AdminQuickAction = {
  id: AdminAction;
  label: string;
  description: string;
  icon: AdminIconName;
};

export type AdminMovement = {
  id: string;
  requester: string;
  requesterRole: string;
  item: string;
  itemKind: "key" | "equipment" | "material";
  date: string;
  time: string;
  /** Código exibido; sem ele, a tela mostra o id. */
  protocol?: string;
  status: string;
};

/** Dados reais do painel. Sem eles, a tela fica no modo demonstrativo. */
export type AdminDashboardLive = {
  metrics: AdminMetric[];
  quickActions: AdminQuickAction[];
  movements: AdminMovement[];
  dateLabel: string;
  loading: boolean;
  error?: string;
  onRefresh: () => void;
};

export type AdminDashboardDemoCopy = {
  dateLabel: string;
  shiftLabel: string;
  activeFlowsLabel: string;
  activeRequestsLabel: string;
  initialFeedback: string;
};

export type AdminIconName =
  | "alert"
  | "analytics"
  | "arrow"
  | "badge"
  | "calendar"
  | "check"
  | "chevron"
  | "dashboard"
  | "inventory"
  | "key"
  | "logout"
  | "menu"
  | "pending"
  | "refresh"
  | "report"
  | "return"
  | "scanner"
  | "search"
  | "swap"
  | "user";

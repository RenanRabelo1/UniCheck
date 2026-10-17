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
  | "refresh";

export type AdminMetric = {
  id: "pending" | "approved" | "checked-out" | "returns";
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
  status: "Pendente" | "Aprovada" | "Em uso" | "Devolvida";
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

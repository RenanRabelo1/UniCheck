export type RequestConfirmationItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  description?: string;
  project?: string;
  withdrawalLocation?: string;
};

/** O que o usuário escolheu no formulário: serve para enviar ao servidor e para voltar e editar. */
export type RequestDraft = {
  roomId: string;
  date: string;
  pickupTime: string;
  returnTime: string;
  notes: string;
  items: { type: "material" | "key"; id: string; quantity: number }[];
};

export type RequestConfirmationData = {
  draft?: RequestDraft;
  usageDate: string;
  location: string;
  pickupTime: string;
  returnTime: string;
  notes?: string;
  items: RequestConfirmationItem[];
};

export type RequestItemStatus =
  | "PENDENTE"
  | "APROVADO"
  | "RECUSADO"
  | "RETIRADO"
  | "DEVOLVIDO"
  | "RESERVADO"
  | "ATRASADO";

export type RequestItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  status: RequestItemStatus;
  code?: string;
  rejectionReason?: string;
  pickup?: {
    date: string;
    attendant: string;
  };
  return?: {
    date?: string;
    dueDate: string;
    attendant?: string;
    condition?: string;
  };
};

export type RequestTimelineEntry = {
  id: string;
  date: string;
  title: string;
  description: string;
  isNextStep?: boolean;
};

export type RequestDetails = {
  id: string;
  protocol: string;
  statusLabel: string;
  requester: {
    name: string;
    role: string;
    registration: string;
  };
  purpose: string;
  location: string;
  requestedAt: string;
  period: string;
  notes?: string;
  items: RequestItem[];
  timeline: RequestTimelineEntry[];
};

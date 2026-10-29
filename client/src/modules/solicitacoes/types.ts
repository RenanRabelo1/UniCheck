export type MyRequestStatus =
  "in-possession" | "approved" | "pending" | "returned" | "rejected";

export type MyRequest = {
  id: string;
  protocol: string;
  requestedAt: string;
  period: string;
  item: string;
  secondaryItem?: string;
  destination: string;
  schedule: string;
  status: MyRequestStatus;
  instruction: string;
};

/** Um item da lista "o que você quer solicitar": material ou chave. */
export type CatalogItem = {
  type: "material" | "key";
  id: string;
  name: string;
  detail: string | null;
  /** Só chaves: a sala a que pertencem. */
  roomId: string | null;
  total: number;
  /** Unidades livres na data e horário informados (sem horário, é o estoque total). */
  available: number;
  /** Bloqueado para este usuário (ex.: aluno sem autorização pedindo chave). */
  locked: boolean;
  lockedReason: string | null;
};

export type RequestOptions = {
  rooms: { value: string; label: string }[];
  items: CatalogItem[];
  authorization: { project: string; responsibleProfessor: string | null } | null;
};

/** Data e horário que o usuário já informou: com eles o servidor calcula a disponibilidade. */
export type RequestWindow = {
  date: string;
  pickupTime: string;
  returnTime: string;
};

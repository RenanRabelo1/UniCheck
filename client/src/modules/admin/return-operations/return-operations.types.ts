export type ReturnCondition = "INTEGRO" | "AVARIADO" | "INCOMPLETO";

export interface CustodyItem {
  id: string;
  description: string;
  identifier: string;
  category: "Material" | "Chave";
  withdrawalAt: string;
}

export interface CustodyRecord {
  id: string;
  protocol: string;
  requester: {
    name: string;
    registration: string;
    contact: string;
    course: string;
  };
  purpose: string;
  withdrawnAt: string;
  items: CustodyItem[];
}

export interface ItemReturnDraft {
  checked: boolean;
  condition: ReturnCondition | "";
}

export interface DemonstrativeReturnPayload {
  custodyId: string;
  returnedAt: string;
  homologated: true;
  items: Array<{
    itemId: string;
    condition: ReturnCondition;
  }>;
}

export interface ReturnOperationsProps {
  onReturnConfirmed?: (payload: DemonstrativeReturnPayload) => void;
}

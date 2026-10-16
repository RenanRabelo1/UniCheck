export type CheckoutItemKind = 'MATERIAL' | 'CHAVE';

export interface ApprovedCheckoutItem {
  id: string;
  name: string;
  kind: CheckoutItemKind;
  identifier: string;
  details: string;
}

export interface ApprovedCheckoutRequest {
  id: string;
  protocol: string;
  requestedAt: string;
  applicant: {
    name: string;
    registration: string;
    email: string;
    phone: string;
    role: 'Professor' | 'Professora' | 'Aluno';
    project?: string;
  };
  approvedItems: ApprovedCheckoutItem[];
}

export interface CheckoutCoordinator {
  id: string;
  name: string;
  registration: string;
}

export interface CheckoutConfirmationResult {
  demonstrationProtocol: string;
  requestProtocol: string;
  coordinatorId: string;
  checkedOutItemIds: string[];
  checkedOutAt: string;
  isDemonstration: true;
}

export interface CheckoutOperationsProps {
  /** Called after the local, demonstrative confirmation. No data is persisted. */
  onCheckoutConfirmed?: (result: CheckoutConfirmationResult) => void;
}

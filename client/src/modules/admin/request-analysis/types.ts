export type RequestItemDecision = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RequestAnalysisRequester {
  name: string;
  role: string;
  registration: string;
  email: string;
  phone: string;
}

export interface RequestAnalysisItem {
  id: string;
  name: string;
  description: string;
  requestedQuantity: number;
  availableQuantity: number;
  availabilityLabel: string;
}

export interface RequestAnalysisRequest {
  protocol: string;
  requestedAt: string;
  purpose: string;
  returnDeadline: string;
  requester: RequestAnalysisRequester;
  items: RequestAnalysisItem[];
}

export interface ItemVisualDecision {
  itemId: string;
  decision: RequestItemDecision;
  refusalReason: string;
}

export interface RequestAnalysisVisualResult {
  protocol: string;
  items: ItemVisualDecision[];
  concludedAt: string;
}

export interface RequestAnalysisScreenProps {
  request?: RequestAnalysisRequest;
  onBackToPending: () => void;
  onCompleteAnalysis: (result: RequestAnalysisVisualResult) => void;
}

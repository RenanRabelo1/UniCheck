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

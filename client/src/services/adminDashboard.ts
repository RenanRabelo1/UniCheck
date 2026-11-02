import { z } from "zod";
import { getJson, parseResponse, sessionToken } from "./api";

const adminDashboardSchema = z.object({
  summary: z.object({
    pendingItems: z.number(),
    approvedItems: z.number(),
    withdrawnItems: z.number(),
    pendingReturns: z.number(),
    openAlerts: z.number(),
  }),
  recentRequests: z.array(
    z.object({
      id: z.string(),
      protocol: z.string(),
      requester: z.string().nullable(),
      requesterRole: z.string().nullable(),
      items: z.array(z.string()),
      date: z.string(),
      pickupTime: z.string(),
      returnTime: z.string(),
      statusLabel: z.string(),
    }),
  ),
});
export type AdminDashboardData = z.infer<typeof adminDashboardSchema>;

export async function getAdminDashboard(
  signal?: AbortSignal,
): Promise<AdminDashboardData> {
  return parseResponse(
    adminDashboardSchema,
    await getJson("/dashboard/admin", sessionToken(), signal),
  );
}

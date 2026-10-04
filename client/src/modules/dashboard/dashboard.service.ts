import { z } from 'zod'
import { getJson } from '../../services/api'
import { getMockDashboard } from './dashboard.mock'
import { DashboardData, DashboardService } from './dashboard.types'

const dashboardSchema = z.object({
  user: z.object({
    name: z.string(),
    registration: z.string(),
    role: z.enum(['professor', 'student']),
    roleLabel: z.string(),
  }),
  summary: z.object({
    pending: z.number().int().nonnegative(),
    approved: z.number().int().nonnegative(),
    inPossession: z.number().int().nonnegative(),
  }),
  recentActivity: z.array(z.object({
    id: z.string(),
    icon: z.string(),
    title: z.string(),
    detail: z.string(),
    status: z.string(),
    tone: z.enum(['approved', 'active', 'returned']),
  })),
})

const useApi = import.meta.env.VITE_DATA_SOURCE === 'api'

export const dashboardService: DashboardService = {
  async getDashboard(session) {
    if (!useApi) {
      return getMockDashboard(session)
    }

    const token = sessionStorage.getItem('unicheck_token') ?? undefined
    const data = await getJson<unknown>('/dashboard', token)
    return dashboardSchema.parse(data) as DashboardData
  },
}

export type DashboardRole = 'professor' | 'student'

export type DashboardSession = {
  name: string
  registration: string
  role: DashboardRole
  roleLabel: string
}

export type ActivityStatus = 'approved' | 'active' | 'returned'

export type RecentActivity = {
  id: string
  icon: string
  title: string
  detail: string
  status: string
  tone: ActivityStatus
}

export type DashboardSummary = {
  pending: number
  approved: number
  inPossession: number
}

export type DashboardData = {
  user: DashboardSession
  summary: DashboardSummary
  recentActivity: RecentActivity[]
}

export interface DashboardService {
  getDashboard(session: DashboardSession): Promise<DashboardData>
}

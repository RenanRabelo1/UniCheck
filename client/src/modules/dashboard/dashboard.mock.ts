import { DashboardData, DashboardSession } from './dashboard.types'

const recentActivity: DashboardData['recentActivity'] = [
  {
    id: 'request-001',
    icon: '▣',
    title: 'Notebook Dell Latitude + carregador',
    detail: 'Solicitado hoje, 14:15 · Retirada autorizada na secretaria',
    status: 'Aprovada',
    tone: 'approved',
  },
  {
    id: 'request-002',
    icon: '◉',
    title: 'Projetor Epson WXGA + adaptador HDMI/USB-C',
    detail: 'Em posse desde 23/10, 09:30 · Patrimônio #24810',
    status: 'Em posse',
    tone: 'active',
  },
  {
    id: 'request-003',
    icon: '◈',
    title: 'Kit Arduino e Sensores IoT - Bancada B02',
    detail: 'Devolvido em 21/10, 17:45 · Conferido pela equipe de suporte',
    status: 'Devolvida',
    tone: 'returned',
  },
]

export function getMockDashboard(session: DashboardSession): DashboardData {
  return {
    user: session,
    summary: { pending: 1, approved: 2, inPossession: 3 },
    recentActivity,
  }
}

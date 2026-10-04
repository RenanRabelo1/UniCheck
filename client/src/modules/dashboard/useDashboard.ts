import { useEffect, useState } from 'react'
import { dashboardService } from './dashboard.service'
import { DashboardData, DashboardSession } from './dashboard.types'

type DashboardState = {
  data?: DashboardData
  error?: string
  isLoading: boolean
}

export function useDashboard(session: DashboardSession) {
  const [state, setState] = useState<DashboardState>({ isLoading: true })
  const [reloadKey, setReloadKey] = useState(0)
  const { name, registration, role, roleLabel } = session

  useEffect(() => {
    let isCurrentRequest = true

    void dashboardService
      .getDashboard({ name, registration, role, roleLabel })
      .then((data) => {
        if (isCurrentRequest) {
          setState({ data, isLoading: false })
        }
      })
      .catch(() => {
        if (isCurrentRequest) {
          setState({ error: 'Não foi possível carregar o painel. Tente novamente.', isLoading: false })
        }
      })

    return () => {
      isCurrentRequest = false
    }
  }, [name, registration, role, roleLabel, reloadKey])

  return {
    ...state,
    reload: () => {
      setState((current) => ({ ...current, error: undefined, isLoading: true }))
      setReloadKey((current) => current + 1)
    },
  }
}

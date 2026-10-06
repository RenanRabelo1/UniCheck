import type { Request, Response } from 'express'
import { dashboardService } from './dashboard.service.js'

export async function getDashboard(req: Request, res: Response) {
  res.json(await dashboardService.getDashboard(req.auth!.usuario))
}

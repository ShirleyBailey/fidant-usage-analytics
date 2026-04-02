import { Router, Response } from 'express'
import { AuthRequest } from '../../middlewares/auth'
import { statsQuerySchema } from './usage.utils'
import { getUsageStats } from './usage.service'

export const usageRouter = Router()

usageRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized'
      })
    }

    const parsed = statsQuerySchema.safeParse(req.query)

    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.errors[0].message
      })
    }

    const { days } = parsed.data

    const data = await getUsageStats(req.user.id, days)

    return res.json(data)
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      error: 'Internal Server Error'
    })
  }
})
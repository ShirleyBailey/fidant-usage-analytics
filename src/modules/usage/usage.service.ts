import { prisma } from '../../lib/prisma'
import { getDateRange } from '../../lib/date'
import { UsageStatsResponse } from './usage.types'
import { isRecent } from './usage.utils'

const PLAN_LIMITS: Record<string, number> = {
  starter: 30,
  pro: 100,
  executive: 500
}

export async function getUsageStats(
  userId: number,
  days: number
): Promise<UsageStatsResponse> {
  const user = await prisma.users.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw new Error('User not found')
  }

  const plan = user.plan_tier
  const daily_limit = PLAN_LIMITS[plan] || 30

  const dateRange = getDateRange(days)
  const from = dateRange[0]
  const to = dateRange[dateRange.length - 1]

  const events = await prisma.daily_usage_events.findMany({
    where: {
      user_id: userId,
      date_key: {
        gte: from,
        lte: to
      }
    }
  })

  const map: Record<
    string,
    { committed: number; reserved: number }
  > = {}

  for (const date of dateRange) {
    map[date] = { committed: 0, reserved: 0 }
  }

  for (const event of events) {
    if (!map[event.date_key]) continue

    if (event.status === 'committed') {
      map[event.date_key].committed += 1
    }

    if (event.status === 'reserved') {
      if (event.reserved_at && isRecent(event.reserved_at)) {
        map[event.date_key].reserved += 1
      }
    }
  }

  const daysData = dateRange.map((date) => {
    const committed = map[date].committed
    const reserved = map[date].reserved

    return {
      date,
      committed,
      reserved,
      limit: daily_limit,
      utilization: committed / daily_limit
    }
  })

  return {
    plan,
    daily_limit,
    period: { from, to },
    days: daysData,
    summary: {
      total_committed: 0,
      avg_daily: 0,
      peak_day: null,
      current_streak: 0
    }
  }
}
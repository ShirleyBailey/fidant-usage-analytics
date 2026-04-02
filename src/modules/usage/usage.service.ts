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

  const map: Record<string, { committed: number; reserved: number }> = {}

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

  // -------------------------
  // 🔥 STEP 4: SUMMARY 
  // -------------------------

  // 1. total_committed
  const total_committed = daysData.reduce(
    (sum, d) => sum + d.committed,
    0
  )

  // 2. avg_daily
  const avg_daily =
    daysData.length > 0 ? total_committed / daysData.length : 0

  // 3. peak_day
  let peak_day: { date: string; count: number } | null = null

  for (const d of daysData) {
    if (!peak_day || d.committed > peak_day.count) {
      peak_day = { date: d.date, count: d.committed }
    }
  }

  if (peak_day && peak_day.count === 0) {
    peak_day = null
  }

  let current_streak = 0

  for (let i = daysData.length - 1; i >= 0; i--) {
    if (daysData[i].committed > 0) {
      current_streak++
    } else {
      break
    }
  }

  return {
    plan,
    daily_limit,
    period: { from, to },
    days: daysData,
    summary: {
      total_committed,
      avg_daily,
      peak_day,
      current_streak
    }
  }
}
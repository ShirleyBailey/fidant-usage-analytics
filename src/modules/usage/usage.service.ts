import { prisma } from '../../lib/prisma'
import { getDateRange } from '../../lib/date'
import { UsageStatsResponse } from './usage.types'
import { isRecent } from './usage.utils'

// type
type PlanTier = 'starter' | 'pro' | 'executive'

// constants
const PLAN_LIMITS: Record<PlanTier, number> = {
  starter: 30,
  pro: 100,
  executive: 500
}

export async function getUsageStats(
  userId: number,
  days: number
): Promise<UsageStatsResponse> {
  // user fetch
  const user = await prisma.users.findUnique({
    where: { id: userId }
  })

  if (!user) {
    throw new Error('User not found')
  }

  // safe cast
  const plan = user.plan_tier as PlanTier
  const daily_limit = PLAN_LIMITS[plan] ?? 30

  // date range
  const dateRange = getDateRange(days)
  const from = dateRange[0]
  const to = dateRange[dateRange.length - 1]

  const now = new Date()

  // fetch cache
  const cacheEntries = await prisma.daily_usage_cache.findMany({
    where: {
      user_id: userId,
      date_key: {
        in: dateRange
      }
    }
  })

  const cacheMap: Record<
    string,
    { committed: number; reserved: number; updated_at: Date }
  > = {}

  for (const c of cacheEntries) {
    cacheMap[c.date_key] = {
      committed: c.committed,
      reserved: c.reserved,
      updated_at: c.updated_at
    }
  }

  const map: Record<string, { committed: number; reserved: number }> = {}

  for (const date of dateRange) {
    map[date] = { committed: 0, reserved: 0 }
  }

  const missingDates: string[] = []

  // decide cache usage
  for (const date of dateRange) {
    const cache = cacheMap[date]

    if (!cache) {
      missingDates.push(date)
      continue
    }

    const ageMs = now.getTime() - cache.updated_at.getTime()

    // 5 min freshness
    if (ageMs > 5 * 60 * 1000) {
      missingDates.push(date)
    } else {
      map[date] = {
        committed: cache.committed,
        reserved: cache.reserved
      }
    }
  }

  // recompute missing
  if (missingDates.length > 0) {
    const events = await prisma.daily_usage_events.findMany({
      where: {
        user_id: userId,
        date_key: {
          in: missingDates
        }
      }
    })

    const temp: Record<string, { committed: number; reserved: number }> = {}

    for (const date of missingDates) {
      temp[date] = { committed: 0, reserved: 0 }
    }

    for (const event of events) {
      if (!temp[event.date_key]) continue

      if (event.status === 'committed') {
        temp[event.date_key].committed += 1
      }

      if (event.status === 'reserved') {
        if (event.reserved_at && isRecent(event.reserved_at)) {
          temp[event.date_key].reserved += 1
        }
      }
    }

    // batch upsert (no N+1)
    await prisma.$transaction(
      missingDates.map((date) => {
        const value = temp[date]

        map[date] = value

        return prisma.daily_usage_cache.upsert({
          where: {
            user_id_date_key: {
              user_id: userId,
              date_key: date
            }
          },
          update: {
            committed: value.committed,
            reserved: value.reserved
          },
          create: {
            user_id: userId,
            date_key: date,
            committed: value.committed,
            reserved: value.reserved
          }
        })
      })
    )
  }

  // build days array
  const daysData = dateRange.map((date) => {
    const committed = map[date].committed
    const reserved = map[date].reserved

    return {
      date,
      committed,
      reserved,
      limit: daily_limit,
      utilization: Number((committed / daily_limit).toFixed(2))
    }
  })

  // summary
  const total_committed = daysData.reduce(
    (sum, d) => sum + d.committed,
    0
  )

  const avg_daily =
    daysData.length > 0 ? total_committed / daysData.length : 0

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
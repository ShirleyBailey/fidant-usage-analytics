import { UsageStatsResponse } from './usage.types'

export async function getUsageStats(
  userId: number,
  days: number
): Promise<UsageStatsResponse> {
  return {
    plan: 'starter',
    daily_limit: 30,
    period: {
      from: '',
      to: ''
    },
    days: [],
    summary: {
      total_committed: 0,
      avg_daily: 0,
      peak_day: null,
      current_streak: 0
    }
  }
}
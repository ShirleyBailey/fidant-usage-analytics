export interface UsageDay {
  date: string
  committed: number
  reserved: number
  limit: number
  utilization: number
}

export interface UsageSummary {
  total_committed: number
  avg_daily: number
  peak_day: {
    date: string
    count: number
  } | null
  current_streak: number
}

export interface UsageStatsResponse {
  plan: string
  daily_limit: number
  period: {
    from: string
    to: string
  }
  days: UsageDay[]
  summary: UsageSummary
}
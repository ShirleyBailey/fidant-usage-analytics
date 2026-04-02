import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface UsageDay {
  date: string
  committed: number
  reserved: number
  limit: number
  utilization: number
}

interface Summary {
  total_committed: number
  avg_daily: number
  peak_day: { date: string; count: number } | null
  current_streak: number
}

interface UsageResponse {
  plan: string
  daily_limit: number
  period: { from: string; to: string }
  days: UsageDay[]
  summary: Summary
}

export default function UsageStats() {
  const [data, setData] = useState<UsageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(
            'http://localhost:3000/api/usage/stats?days=7'
        )
        setData(res.data)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return null

  const today = data.days[data.days.length - 1]
  const progress = Math.min(
    (today.committed / data.daily_limit) * 100,
    100
  )

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2>Usage Stats ({data.plan})</h2>

      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div>Today Usage</div>
        <div
          style={{
            background: '#eee',
            height: 10,
            borderRadius: 5
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#4caf50',
              borderRadius: 5
            }}
          />
        </div>
        <div>
          {today.committed} / {data.daily_limit}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.days}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="committed" />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div style={{ marginTop: 20 }}>
        <div>Total: {data.summary.total_committed}</div>
        <div>Avg Daily: {data.summary.avg_daily.toFixed(2)}</div>
        <div>
          Peak:{' '}
          {data.summary.peak_day
            ? `${data.summary.peak_day.date} (${data.summary.peak_day.count})`
            : 'N/A'}
        </div>
        <div>Streak: {data.summary.current_streak}</div>
      </div>
    </div>
  )
}
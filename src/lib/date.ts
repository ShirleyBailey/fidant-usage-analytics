import dayjs from 'dayjs'

export function getDateRange(days: number): string[] {
  const today = dayjs()
  const result: string[] = []

  for (let i = days - 1; i >= 0; i--) {
    result.push(today.subtract(i, 'day').format('YYYY-MM-DD'))
  }

  return result
}
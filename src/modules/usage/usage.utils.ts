import { z } from 'zod'

export const statsQuerySchema = z.object({
  days: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : 7))
    .refine((val) => val >= 1 && val <= 90, {
      message: 'days must be between 1 and 90'
    })
})

export function isRecent(date: Date): boolean {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  return diff <= 15 * 60 * 1000 
}
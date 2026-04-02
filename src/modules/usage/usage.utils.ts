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
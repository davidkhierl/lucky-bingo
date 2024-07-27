import { z } from 'zod'

export const messageCommandSchema = z.object({
    code: z.number(),
})

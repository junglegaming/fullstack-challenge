import * as z from "zod"

export const verifyRoundSchema = z.object({
  roundId: z.coerce.string(),
})

export type verifyRoundFormValues = z.infer<typeof verifyRoundSchema>

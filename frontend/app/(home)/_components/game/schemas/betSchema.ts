import { z } from "zod"

export const betSchema = z.object({
  amount: z
    .bigint()
    .min(1n, "A aposta mínima é de R$ 1,00")
    .max(100000n, "A aposta máxima é de R$ 1.000,00"),
  multiplierAtCashout: z.number().min(1),
})

export type BetFormData = z.infer<typeof betSchema>

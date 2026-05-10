import * as z from "zod"

export const depositSchema = z.object({
  amountInCents: z.coerce
    .string()
    .min(1, { message: "O valor mínimo para depósito é R$ 0,01" })
    .max(1000000, { message: "O valor excede o limite permitido" }),
})

export type DepositFormValues = z.infer<typeof depositSchema>
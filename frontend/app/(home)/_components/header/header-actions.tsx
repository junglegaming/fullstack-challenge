"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Controller } from "react-hook-form"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { useDepositForm } from "./hooks/use-deposit-form"
import { numberToCurrency, parseCurrency } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { Separator } from "@/components/ui/separator"

export function HeaderActions({ balance }: { balance: string }) {
  const { data: session } = useSession()
  const { form, handleDeposit } = useDepositForm()

  if (!session) {
    return null
  }

  return (
    <div className="flex items-center rounded-full border border-border bg-muted">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
          R$
        </span>
        <Separator orientation="vertical" />
        <span className="text-sm font-bold text-primary">
          {numberToCurrency(balance)}
        </span>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="m-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary p-0 text-white hover:bg-primary/90"
          >
            <Plus className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-106">
          <form onSubmit={form.handleSubmit((data) => handleDeposit(data))}>
            <DialogHeader>
              <DialogTitle>Adicionar Fundos</DialogTitle>
              <DialogDescription>
                Insira o valor que deseja adicionar à sua conta.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Controller
                control={form.control}
                name="amountInCents"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Valor</FieldLabel>
                    <div className="relative">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        R$
                      </span>

                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder={numberToCurrency(0n)}
                        autoComplete="off"
                        type="text"
                        value={field.value ? numberToCurrency(field.value) : ""}
                        onChange={(e) => {
                          const value = parseCurrency(e.target.value)
                          field.onChange(value)
                        }}
                        className="pl-10 font-mono"
                      />
                    </div>
                    <FieldDescription>
                      Insira o valor que deseja adicionar à sua conta.
                    </FieldDescription>

                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Depositar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

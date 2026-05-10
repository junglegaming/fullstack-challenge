import { Controller } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

import { Compass, X, Zap } from "lucide-react"
import useFormPanel from "./hooks/useFormPanel"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { numberToCurrency, parseCurrency } from "@/lib/utils"
import { AuthModal } from "@/components/auth-modal"

const APOSTA_BUTTONS = ["1/2", "2x", "Max"]
const MULTIPLICADOR_BUTTONS = ["1/2", "2x", "10x"]

export function BetPanel() {
  const {
    form,
    onSubmit,
    buttonText,
    potentialWin,
    isButtonDisabled,
    showAuthModal,
    setShowAuthModal,
    autoCashoutConfig,
    setAutoCashoutConfig,
    currentMultiplier,
  } = useFormPanel()

  return (
    <Card className="rounded-4xl border-border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Compass className="size-5 fill-primary text-accent" />
          Painel
        </CardTitle>
        <Separator className="mt-2" />
      </CardHeader>

      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Controller
              name="amount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Aposta</FieldLabel>

                  <div className="flex items-center rounded-full border border-border bg-muted px-3 py-1">
                    <span className="text-xs text-muted-foreground">R$</span>
                    <Separator orientation="vertical" className="mx-2" />

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
                      className="border-none bg-transparent! p-0 text-sm font-bold text-primary focus-visible:ring-0"
                    />

                    <div className="ml-auto flex gap-1">
                      {APOSTA_BUTTONS.map((button) => (
                        <Button
                          key={button}
                          type="button"
                          size="sm"
                          className="rounded-xl px-2 py-1 text-xs"
                          onClick={() => {
                            const value = form.getValues("amount") || 0n
                            const MAX_BET = 100000n
                            if (button === "1/2") {
                              form.setValue(
                                "amount",
                                BigInt(Math.max(0, Number(value) / 2))
                              )
                            }

                            if (button === "2x") {
                              form.setValue(
                                "amount",
                                value * 2n <= MAX_BET ? value * 2n : MAX_BET
                              )
                            }

                            if (button === "Max") {
                              form.setValue("amount", MAX_BET)
                            }
                          }}
                        >
                          {button}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Controller
              name="multiplierAtCashout"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Multiplicador</FieldLabel>

                  <div className="flex items-center rounded-full border border-border bg-muted px-3 py-1">
                    <X className="text-muted-foreground" />

                    <Separator orientation="vertical" className="mx-2" />

                    <Input
                      id={field.name}
                      value={field.value ?? 1}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        field.onChange(Number.isFinite(value) ? value : 1)
                      }}
                      aria-invalid={fieldState.invalid}
                      className="border-none bg-transparent! p-0 text-sm font-bold text-primary focus-visible:ring-0"
                    />

                    <div className="ml-auto flex gap-1">
                      {MULTIPLICADOR_BUTTONS.map((button) => (
                        <Button
                          key={button}
                          type="button"
                          size="sm"
                          className="rounded-xl px-2 py-1 text-xs"
                          onClick={() => {
                            const value =
                              form.getValues("multiplierAtCashout") || 1

                            const MAX_MULTIPLIER = 10

                            if (button === "1/2") {
                              form.setValue(
                                "multiplierAtCashout",
                                Math.max(0, value / 2)
                              )
                            }

                            if (button === "2x") {
                              form.setValue(
                                "multiplierAtCashout",
                                Math.min(MAX_MULTIPLIER, value * 2)
                              )
                            }

                            if (button === "Max") {
                              form.setValue(
                                "multiplierAtCashout",
                                MAX_MULTIPLIER
                              )
                            }
                          }}
                        >
                          {button}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <div className="flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
            <span>Ganho Potencial:</span>
            <span className="text-sm font-bold text-primary">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(potentialWin)}
            </span>
          </div>

          <div className="rounded-2xl border border-border/50 from-accent/5 to-transparent p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-accent" />
                <div className="flex flex-col gap-0.5">
                  <FieldLabel className="text-xs font-semibold">
                    Auto Cashout
                  </FieldLabel>
                  <p className="text-xs text-muted-foreground">
                    Saca automaticamente em
                  </p>
                </div>
              </div>
              <Switch
                checked={autoCashoutConfig.isEnabled}
                onCheckedChange={(checked) =>
                  setAutoCashoutConfig({
                    ...autoCashoutConfig,
                    isEnabled: checked,
                  })
                }
                aria-label="Ativar auto cashout"
              />
            </div>

            {autoCashoutConfig.isEnabled && (
              <div className="mt-3 flex animate-in items-center gap-2 rounded-xl bg-background/50 px-3 py-2 transition-all duration-300 fade-in slide-in-from-top-2">
                <X className="text-muted-foreground" />

                <Input
                  type="text"
                  inputMode="decimal"
                  className="border-none bg-transparent! p-0 text-sm font-bold text-primary focus-visible:ring-0"
                  value={autoCashoutConfig.multiplier}
                  onChange={(e) => {
                    let val = e.target.value
                    val = val.replace(",", ".")
                    setAutoCashoutConfig({
                      ...autoCashoutConfig,
                      multiplier: Number(val),
                    })
                  }}
                />

                {currentMultiplier > 0 && (
                  <div className="ml-auto flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-primary">
                        {currentMultiplier.toFixed(2)}x
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {autoCashoutConfig.isEnabled &&
                        currentMultiplier >= autoCashoutConfig.multiplier
                          ? "Pronto para sacar!"
                          : `Faltam ${(
                              autoCashoutConfig.multiplier - currentMultiplier
                            ).toFixed(2)}x`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className={`mt-2 h-12 w-full rounded-full text-lg font-bold ${
              isButtonDisabled ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            {buttonText}
          </Button>
        </form>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </CardContent>
    </Card>
  )
}

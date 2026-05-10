"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Copy, ShieldCheck } from "lucide-react"
import useVerifyRound from "./hooks/use-verify-round"
import { Controller } from "react-hook-form"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Clock } from "lucide-react"

export function VerifyRoundDialog() {
  const {
    form,
    handleVerify,
    loading,
    verificationData,
    open,
    setOpen,
    copied,
    copyToClipboard,
  } = useVerifyRound()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          Verificar Rodada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl!">
        <DialogHeader>
          <DialogTitle>Verificar Integridade da Rodada</DialogTitle>
          <DialogDescription>
            Digite o ID da rodada para verificar se o resultado é legítimo
            usando Provably Fair.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleVerify)} className="space-y-4">
          <Controller
            control={form.control}
            name="roundId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>ID da Rodada</FieldLabel>
                <Input
                  {...field}
                  id="roundId"
                  placeholder="ex: 550e8400-e29b-41d4-a716-446655440000"
                  disabled={loading}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Verificando..." : "Verificar"}
            </Button>
          </DialogFooter>
        </form>

        {verificationData && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-muted/20 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Multiplicador Final
                </p>
                <p className="text-4xl font-bold text-primary">
                  {verificationData.crashPoint.toFixed(2)}x
                </p>
              </div>

              <div className="rounded-lg border bg-muted/20 p-4 text-center">
                <p className="text-xs text-muted-foreground">Status</p>
                <p
                  className={`text-3xl font-semibold ${
                    verificationData.status === "CRASHED"
                      ? "text-destructive"
                      : "text-foreground"
                  }`}
                >
                  {verificationData.status === "CRASHED" ? "Saque" : "Ativa"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Duração</p>
                <p className="text-sm font-semibold">
                  {Math.round(
                    (new Date(verificationData.endTime).getTime() -
                      new Date(verificationData.startTime).getTime()) /
                      1000
                  )}
                  s
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-semibold">
                Verificação (Provably Fair)
              </p>

              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  Server Seed Hash
                </p>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(verificationData.serverSeedHash, "hash")
                  }
                  className="relative w-full text-left"
                >
                  <p className="rounded border bg-background/50 p-2 font-mono text-xs break-all">
                    {verificationData.serverSeedHash}
                  </p>
                  <Copy
                    className={`absolute top-2 right-2 h-4 w-4 opacity-60 ${
                      copied === "hash"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
                <p className="mt-1 text-xs text-muted-foreground">
                  Revelado após o crash
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  Client Seed
                </p>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(verificationData.clientSeed, "client")
                  }
                  className="relative w-full text-left"
                >
                  <p className="rounded border bg-background/50 p-2 font-mono text-xs break-all">
                    {verificationData.clientSeed}
                  </p>
                  <Copy
                    className={`absolute top-2 right-2 h-4 w-4 opacity-60 ${
                      copied === "client"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              </div>

              {/* Nonce + Round ID */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Nonce</p>
                  <div className="rounded border bg-background/50 p-2 font-mono text-sm">
                    #{verificationData.nonce}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Round ID</p>
                  <div className="rounded border bg-background/50 p-2 font-mono text-xs break-all">
                    {verificationData.id.slice(0, 12)}...
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="rounded-lg border bg-muted/20 p-4 text-center">
              <p className="text-sm font-semibold text-primary">Verificado</p>
              <p className="text-xs text-muted-foreground">
                Os dados acima permitem validar o resultado.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

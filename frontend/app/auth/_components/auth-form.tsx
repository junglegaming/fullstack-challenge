import { Button } from "@/components/ui/button"
import { Loader2, LockKeyholeIcon } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useFormAuth } from "../_hooks/useFormAuth"

export function AuthForm() {
  const { handleLogin, isLoading } = useFormAuth()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Entre com suas credenciais para acessar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleLogin} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            <>
              <LockKeyholeIcon className="mr-2 h-4 w-4" />
              Entrar com Keycloak
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

import { useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import { GamePage } from '@/pages/GamePage'

export function App() {
  const auth = useAuth()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.error) {
      auth.signinRedirect()
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.error, auth])

  if (auth.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Autenticando...
      </div>
    )
  }

  if (auth.error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-zinc-950 text-white">
        <p className="text-red-400">Erro de autenticação: {auth.error.message}</p>
        <button
          onClick={() => auth.signinRedirect()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Redirecionando para login...
      </div>
    )
  }

  return <GamePage />
}

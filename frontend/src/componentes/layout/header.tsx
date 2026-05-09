import { useEffect } from 'react'
import keycloak from '../../services/keycloak'
import { getWallet } from '../../services/wallet.service'
import { useWalletStore } from '../../stores/wallet.store'

export function Header() {
  const balance = useWalletStore((state) => state.balance)
  const setBalance = useWalletStore((state) => state.setBalance)

  useEffect(() => {
    async function loadWallet() {
      try {
        const wallet = await getWallet()

        setBalance(Number(wallet.balance))
      } catch (err) {
        console.error(err)
      }
    }

    loadWallet()
  }, [setBalance])

  return (
    <header className="w-full h-20 border-b border-zinc-800 bg-zinc-950 px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center font-black text-black">
          J
        </div>

        <div>
          <h1 className="text-xl font-bold text-white">
            Jungle Crash
          </h1>

          <p className="text-sm text-zinc-500">
            Real-time crash game
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
          <p className="text-xs text-zinc-500">
            Balance
          </p>

          <h2 className="text-lg font-bold text-green-400">
            ${(balance / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
            {keycloak.tokenParsed?.preferred_username?.[0]?.toUpperCase()}
          </div>

          <div>
            <p className="font-semibold text-white">
              {keycloak.tokenParsed?.preferred_username}
            </p>

            <p className="text-xs text-green-400">
              ● Online
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
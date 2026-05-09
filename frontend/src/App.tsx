import { Header } from './componentes/layout/header'
import { CrashDisplay } from './componentes/game/crash-display'
import { BetControls } from './componentes/game/bet-controls'
import { useEffect, useState } from 'react'
import { createWallet, getWallet } from './services/wallet.service' // 💡 Importado getWallet
import { useWalletStore } from './stores/wallet.store' // 💡 Importado a store da carteira
import { socket } from './services/socket'

function App() {
  const [ready, setReady] = useState(false)
  const setBalance = useWalletStore((state) => state.setBalance) // 💡 Função para injetar o saldo na store

  useEffect(() => {
    socket.connect()

    async function bootstrap() {
      try {
        // 1. Tenta criar a carteira (se for usuário novo)
        const newWallet = await createWallet()
        setBalance(Number(newWallet.balance))
        console.log('✅ Carteira criada com sucesso!')
      } catch (err) {
        console.log('ℹ️ Carteira já existe. Sincronizando saldo atual...')
        
        // 2. Se já existe, busca o saldo real no banco de dados para sincronizar a store local!
        try {
          const existingWallet = await getWallet()
          setBalance(Number(existingWallet.balance))
          console.log('✅ Saldo sincronizado na inicialização:', existingWallet.balance)
        } catch (getErr) {
          console.error('❌ Erro crítico ao buscar saldo da carteira:', getErr)
        }
      }

      setReady(true)
    }

    bootstrap()

    return () => {
      socket.disconnect()
    }
  }, [setBalance])

  if (!ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <div className="grid h-[calc(100vh-80px)] grid-cols-1 lg:grid-cols-3">
        <div className="col-span-2 flex items-center justify-center">
          <CrashDisplay />
        </div>

        <div className="flex items-center justify-center border-l border-zinc-800">
          <BetControls />
        </div>
      </div>
    </div>
  )
}

export default App
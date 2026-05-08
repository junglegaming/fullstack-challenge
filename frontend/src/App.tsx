import './services/socket'
import { Header } from './componentes/layout/header'
import { CrashDisplay } from './componentes/game/crash-display'
import { BetControls } from './componentes/game/bet-controls'
import { useEffect, useState } from 'react'
import { createWallet } from './services/wallet.service'

function App() {
 const [ready, setReady] = useState(false)

  useEffect(() => {
    async function bootstrap() {
      try {
        await createWallet()
      } catch (err) {
        console.log('wallet já existe')
      }

      setReady(true)
    }

    bootstrap()
  }, [])

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
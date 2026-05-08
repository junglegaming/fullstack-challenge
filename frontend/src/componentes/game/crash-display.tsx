import { useGameStore } from '../../stores/game.store'

export function CrashDisplay() {
  const multiplier = useGameStore((state) => state.multiplier)
  const crashed = useGameStore((state) => state.crashed)

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div
        className={`
          text-8xl font-black transition-all duration-100
          ${crashed ? 'text-red-500 scale-110' : 'text-green-400'}
        `}
      >
        {multiplier.toFixed(2)}x
      </div>

      <div
        className={`
          mt-6 text-2xl font-bold tracking-widest
          ${crashed ? 'text-red-400' : 'text-zinc-400'}
        `}
      >
        {crashed ? '💥 CRASHED' : '🚀 RUNNING'}
      </div>

      {!crashed && (
        <div className="mt-10 w-[400px] h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-400 animate-pulse"
            style={{
              width: `${Math.min(multiplier * 10, 100)}%`,
            }}
          />
        </div>
      )}
    </div>
  )
}
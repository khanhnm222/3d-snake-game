'use client'
import MiniMap from './MiniMap'
import { useGameStore } from '@/store/store'

const COMPASS: Record<string, string> = {
  north: 'N ↑', south: 'S ↓', east: 'E →', west: 'W ←',
}

export default function HUD() {
  const score     = useGameStore(s => s.score)
  const highScore = useGameStore(s => s.highScore)
  const lives     = useGameStore(s => s.lives)
  const round     = useGameStore(s => s.round)
  const direction = useGameStore(s => s.direction)
  const status    = useGameStore(s => s.status)
  const foodEaten = useGameStore(s => s.foodEaten)

  if (status === 'idle' || status === 'gameover') return null

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 sm:px-4 py-1.5 sm:py-2 bg-black/40 backdrop-blur-sm">
        {/* Round */}
        <div className="font-mono text-xs sm:text-sm min-w-14">
          <span className="text-yellow-300 font-bold">ROUND {round}</span>
        </div>
        {/* Score */}
        <div className="text-center">
          <div className="text-white/60 text-[10px] sm:text-xs font-mono uppercase tracking-widest">Score</div>
          <div className="text-white font-bold font-mono text-base sm:text-xl leading-none">{score}</div>
        </div>
        {/* Best */}
        <div className="text-center">
          <div className="text-white/60 text-[10px] sm:text-xs font-mono uppercase tracking-widest">Best</div>
          <div className="text-yellow-300 font-bold font-mono text-base sm:text-xl leading-none">{highScore}</div>
        </div>
        {/* Lives */}
        <div className="flex gap-0.5 sm:gap-1 items-center min-w-14 justify-end">
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className={`text-base sm:text-lg ${i < lives ? 'text-red-400' : 'text-white/20'}`}>♥</span>
          ))}
        </div>
      </div>

      {/* ── Bottom-left: compass + food count ────────────── */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 flex flex-col gap-1.5">
        <div className="bg-black/50 backdrop-blur-sm rounded px-2 sm:px-3 py-0.5 sm:py-1 font-mono text-xs sm:text-sm text-white">
          🧭 {COMPASS[direction]}
        </div>
        <div className="bg-black/50 backdrop-blur-sm rounded px-2 sm:px-3 py-0.5 sm:py-1 font-mono text-xs sm:text-sm text-white">
          🍎 ×{foodEaten}
        </div>
      </div>

      {/* ── Bottom-right: minimap ─────────────────────────── */}
      <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4">
        <div className="text-white/60 text-[10px] sm:text-xs font-mono text-center mb-1 tracking-widest">MINIMAP</div>
        <MiniMap />
      </div>

      {/* ── Controls hint (top-right, hidden on small screens) ─── */}
      <div className="absolute top-12 sm:top-14 right-2 sm:right-3 hidden sm:block text-white/40 text-xs font-mono text-right leading-5">
        <div>A / ← turn left</div>
        <div>D / → turn right</div>
        <div>P pause</div>
        <div className="mt-1 text-white/25">drag to look around</div>
      </div>

      {/* ── Paused overlay ───────────────────────────────── */}
      {status === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white font-mono text-3xl sm:text-4xl font-bold animate-pulse">PAUSED</div>
        </div>
      )}
    </div>
  )
}
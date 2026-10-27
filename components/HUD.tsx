'use client'
import type { PointerEvent } from 'react'
import MiniMap from './MiniMap'
import { useGameStore } from '@/store/store'
import { useIsTouch } from '@/hooks/useIsTouch'

const COMPASS: Record<string, string> = {
  north: 'N ↑', south: 'S ↓', east: 'E →', west: 'W ←',
}

// Big thumb-friendly turn button (fires on press, not release, for responsiveness)
function TurnButton({ side, onPress }: { side: 'left' | 'right'; onPress: () => void }) {
  const handle = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    onPress()
  }
  return (
    <button
      aria-label={side === 'left' ? 'Turn left' : 'Turn right'}
      onPointerDown={handle}
      onContextMenu={e => e.preventDefault()}
      className="pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-black/35 text-3xl text-white/85 backdrop-blur-sm shadow-lg active:scale-90 active:bg-white/25 transition-transform touch-none"
    >
      {side === 'left' ? '◀' : '▶'}
    </button>
  )
}

export default function HUD() {
  const score     = useGameStore(s => s.score)
  const highScore = useGameStore(s => s.highScore)
  const lives     = useGameStore(s => s.lives)
  const round     = useGameStore(s => s.round)
  const direction = useGameStore(s => s.direction)
  const status    = useGameStore(s => s.status)
  const foodEaten = useGameStore(s => s.foodEaten)
  const touch     = useIsTouch()

  if (status === 'idle' || status === 'gameover') return null

  const { queueTurnLeft, queueTurnRight, pauseGame, resumeGame } = useGameStore.getState()

  const stats = (
    <div className="flex gap-1.5 sm:flex-col">
      <div className="bg-black/50 backdrop-blur-sm rounded px-2 sm:px-3 py-0.5 sm:py-1 font-mono text-xs sm:text-sm text-white">
        🧭 {COMPASS[direction]}
      </div>
      <div className="bg-black/50 backdrop-blur-sm rounded px-2 sm:px-3 py-0.5 sm:py-1 font-mono text-xs sm:text-sm text-white">
        🍎 ×{foodEaten}
      </div>
    </div>
  )

  return (
    <div className="pointer-events-none absolute inset-0 select-none">
      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between gap-2 px-3 sm:px-4 pb-1.5 sm:pb-2 pt-[max(0.375rem,env(safe-area-inset-top))] bg-black/40 backdrop-blur-sm">
        <div className="font-mono text-xs sm:text-sm min-w-14">
          <span className="text-yellow-300 font-bold">ROUND {round}</span>
        </div>
        <div className="text-center">
          <div className="text-white/60 text-[10px] sm:text-xs font-mono uppercase tracking-widest">Score</div>
          <div className="text-white font-bold font-mono text-base sm:text-xl leading-none">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-white/60 text-[10px] sm:text-xs font-mono uppercase tracking-widest">Best</div>
          <div className="text-yellow-300 font-bold font-mono text-base sm:text-xl leading-none">{highScore}</div>
        </div>
        <div className="flex gap-0.5 sm:gap-1 items-center min-w-14 justify-end">
          {Array.from({ length: 3 }, (_, i) => (
            <span key={i} className={`text-base sm:text-lg ${i < lives ? 'text-red-400' : 'text-white/20'}`}>♥</span>
          ))}
          {touch && (
            <button
              aria-label="Pause"
              onPointerDown={e => { e.stopPropagation(); pauseGame() }}
              className="pointer-events-auto ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 border border-white/15 text-xs text-white/80 active:bg-white/25"
            >
              ❚❚
            </button>
          )}
        </div>
      </div>

      {touch ? (
        <>
          {/* Touch: stats + minimap move to the top so thumbs don't cover them */}
          <div className="absolute left-3 top-[calc(max(0.375rem,env(safe-area-inset-top))+3.25rem)]">{stats}</div>
          <div className="absolute right-3 top-[calc(max(0.375rem,env(safe-area-inset-top))+3.25rem)]">
            <MiniMap displaySize={96} />
          </div>

          {/* Turn buttons */}
          <div className="absolute inset-x-0 bottom-0 flex justify-between px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <TurnButton side="left"  onPress={queueTurnLeft} />
            <TurnButton side="right" onPress={queueTurnRight} />
          </div>
          <div className="absolute inset-x-0 bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+5.75rem)] text-center font-mono text-[10px] tracking-widest text-white/40 uppercase">
            swipe to turn · hold &amp; drag to look
          </div>
        </>
      ) : (
        <>
          {/* ── Bottom-left: compass + food count ────────────── */}
          <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4">{stats}</div>

          {/* ── Bottom-right: minimap ─────────────────────────── */}
          <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4">
            <div className="text-white/60 text-[10px] sm:text-xs font-mono text-center mb-1 tracking-widest">MINIMAP</div>
            <MiniMap />
          </div>

          {/* ── Controls hint ─────────────────────────────────── */}
          <div className="absolute top-12 sm:top-14 right-2 sm:right-3 hidden sm:block text-white/40 text-xs font-mono text-right leading-5">
            <div>A / ← turn left</div>
            <div>D / → turn right</div>
            <div>P pause</div>
            <div className="mt-1 text-white/25">drag to look around</div>
          </div>
        </>
      )}

      {/* ── Paused overlay ───────────────────────────────── */}
      {status === 'paused' && (
        <div
          className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50"
          onPointerDown={() => { if (touch) resumeGame() }}
        >
          <div className="text-white font-mono text-3xl sm:text-4xl font-bold animate-pulse">PAUSED</div>
          <div className="font-mono text-xs tracking-widest text-white/50 uppercase">
            {touch ? 'Tap to resume' : 'Press P to resume'}
          </div>
        </div>
      )}
    </div>
  )
}

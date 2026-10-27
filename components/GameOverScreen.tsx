'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useGameStore } from '@/store/store'
import { SNAKE_THEMES } from '@/lib/snakeTheme'
import ScreenShell from './ScreenShell'

const MenuScene = dynamic(() => import('./MenuScene'), { ssr: false })

export default function GameOverScreen({ onPlayAgain, onMenu }: { onPlayAgain: () => void; onMenu: () => void }) {
  const score     = useGameStore(s => s.score)
  const highScore = useGameStore(s => s.highScore)
  const foodEaten = useGameStore(s => s.foodEaten)
  const length    = useGameStore(s => s.snake.length)
  const round     = useGameStore(s => s.round)
  const themeIdx  = useGameStore(s => s.snakeThemeIdx)
  const accent    = (SNAKE_THEMES[themeIdx] ?? SNAKE_THEMES[0]).swatch

  const [playerName, setPlayerName] = useState('')
  const [submitted, setSubmitted]   = useState(false)
  const isNewBest = score > 0 && score >= highScore

  const handleSubmitScore = async () => {
    if (!playerName.trim()) return
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName.trim(), score, round }),
      })
      setSubmitted(true)
    } catch { /* backend optional */ }
  }

  const stats = [
    { label: 'Eaten',  value: foodEaten },
    { label: 'Length', value: length },
    { label: 'Best',   value: highScore },
  ]

  return (
    // tint="slate" (not "red") — the 3D diorama is the same natural garden as
    // the idle screen; only the "Game Over" title/buttons carry the red accent.
    <ScreenShell scene={<MenuScene mode="gameover" />} accent="#ff3a4a">
      <div className="flex flex-col items-center gap-1">
        <p className="font-mono text-[11px] tracking-[0.22em] text-white/40 uppercase">Round {round}</p>
        <h2 className="text-4xl sm:text-5xl font-bold font-mono text-red-400 tracking-tight drop-shadow-[0_2px_16px_rgba(255,60,60,0.45)]">
          Game Over
        </h2>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="font-mono text-5xl font-bold tabular-nums">{score}</p>
        {isNewBest && (
          <p className="font-mono text-xs tracking-[0.25em] uppercase text-amber-300 animate-pulse">★ New Best ★</p>
        )}
      </div>

      <div className="grid w-full grid-cols-3 gap-2">
        {stats.map(s => (
          <div key={s.label} className="flex flex-col items-center rounded-xl bg-black/25 border border-white/5 py-2.5">
            <span className="font-mono text-lg font-bold tabular-nums">{s.value}</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">{s.label}</span>
          </div>
        ))}
      </div>

      {!submitted ? (
        <div className="flex w-full gap-2">
          <input
            type="text"
            placeholder="Your name"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmitScore() }}
            className="min-w-0 flex-1 px-3 py-3 rounded-xl bg-white/10 border border-white/10 font-mono text-base sm:text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
            maxLength={20}
            enterKeyHint="done"
          />
          <button
            onClick={handleSubmitScore}
            className="px-5 py-3 bg-white/15 hover:bg-white/25 border border-white/10 text-white font-bold font-mono rounded-xl transition-colors text-sm"
          >
            Save
          </button>
        </div>
      ) : (
        <p className="font-mono text-green-400 text-sm tracking-wide">Score saved!</p>
      )}

      <div className="flex w-full gap-3">
        <button
          onClick={() => { setSubmitted(false); setPlayerName(''); onPlayAgain() }}
          className="flex-1 py-3.5 active:scale-95 transition-all text-white font-bold font-mono rounded-2xl tracking-widest hover:brightness-110"
          style={{ background: `linear-gradient(135deg, ${accent}cc, ${accent})`, boxShadow: `0 0 24px 0 ${accent}55` }}
        >
          Play Again
        </button>
        <button
          onClick={() => { setSubmitted(false); setPlayerName(''); onMenu() }}
          className="flex-1 py-3.5 bg-white/8 hover:bg-white/15 active:scale-95 transition-all text-white/80 font-bold font-mono rounded-2xl border border-white/10"
        >
          Menu
        </button>
      </div>
    </ScreenShell>
  )
}

'use client'
import { useEffect, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import HUD from './HUD'
import IdleScreen from './IdleScreen'
import { useGameStore, ROUND1_LEVEL } from '@/store/store'

const GameCanvas = dynamic(() => import('./GameCanvas'), { ssr: false })

export default function Game() {
  const status     = useGameStore(s => s.status)
  const startGame  = useGameStore(s => s.startGame)
  const pauseGame  = useGameStore(s => s.pauseGame)
  const resumeGame = useGameStore(s => s.resumeGame)
  const resetGame  = useGameStore(s => s.resetGame)
  const tick       = useGameStore(s => s.tick)
  const score      = useGameStore(s => s.score)
  const highScore  = useGameStore(s => s.highScore)

  const [playerName, setPlayerName] = useState('')
  const [submitted, setSubmitted]   = useState(false)

  // ── Keyboard controls ──────────────────────────────────────────
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (status === 'gameover' || status === 'idle') return
    const { queueTurnLeft, queueTurnRight, queueDirection } = useGameStore.getState()
    switch (e.key) {
      case 'a': case 'A': case 'ArrowLeft':  e.preventDefault(); queueTurnLeft();  break
      case 'd': case 'D': case 'ArrowRight': e.preventDefault(); queueTurnRight(); break
      case 'ArrowUp':   case 'w': case 'W': e.preventDefault(); queueDirection('north'); break
      case 'ArrowDown': case 's': case 'S': e.preventDefault(); queueDirection('south'); break
      case 'p': case 'P': case 'Escape':
        status === 'paused' ? resumeGame() : pauseGame()
        break
    }
  }, [status, pauseGame, resumeGame])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // ── Game loop ──────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'playing') return
    const id = setInterval(tick, ROUND1_LEVEL.speed)
    return () => clearInterval(id)
  }, [status, tick])

  // ── Score submission ───────────────────────────────────────────
  const handleSubmitScore = async () => {
    if (!playerName.trim()) return
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName.trim(), score, round: 1 }),
      })
      setSubmitted(true)
    } catch { /* backend optional */ }
  }

  // ── Screens ────────────────────────────────────────────────────
  if (status === 'idle') {
    return <IdleScreen onPlay={startGame} />
  }

  if (status === 'gameover') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-red-950 to-slate-950 text-white px-6 py-10">
        <p className="font-mono text-[11px] tracking-[0.22em] text-white/30 uppercase mb-3">
          Round 1
        </p>
        <h2 className="text-5xl font-bold font-mono mb-6 text-red-400 tracking-tight">
          Game Over
        </h2>

        <div className="flex flex-col items-center mb-8 gap-1">
          <p className="font-mono text-3xl font-bold">{score}</p>
          <p className="font-mono text-xs text-white/30 tracking-widest uppercase">
            {highScore > score ? `Best  ${highScore}` : 'New Best!'}
          </p>
        </div>

        {/* Score submission */}
        {!submitted ? (
          <div className="flex gap-2 mb-8 w-full max-w-xs">
            <input
              type="text"
              placeholder="Your name"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmitScore()}
              className="flex-1 px-3 py-2.5 rounded-xl bg-white/10 border border-white/10 font-mono text-sm text-white placeholder-white/25 outline-none focus:border-white/30"
              maxLength={20}
            />
            <button
              onClick={handleSubmitScore}
              className="px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/10 text-white font-bold font-mono rounded-xl transition-colors text-sm"
            >
              Save
            </button>
          </div>
        ) : (
          <p className="font-mono text-green-400 text-sm mb-8 tracking-wide">
            Score saved!
          </p>
        )}

        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => { setSubmitted(false); setPlayerName(''); startGame() }}
            className="flex-1 py-3.5 bg-green-600 hover:bg-green-500 active:scale-95 transition-all text-white font-bold font-mono rounded-2xl tracking-widest"
          >
            Play Again
          </button>
          <button
            onClick={() => { setSubmitted(false); setPlayerName(''); resetGame() }}
            className="flex-1 py-3.5 bg-white/8 hover:bg-white/15 active:scale-95 transition-all text-white/70 font-bold font-mono rounded-2xl border border-white/10"
          >
            Menu
          </button>
        </div>
      </div>
    )
  }

  // Playing / Paused
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <GameCanvas />
      <HUD />
    </div>
  )
}
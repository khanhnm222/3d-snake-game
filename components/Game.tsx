'use client'
import { useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import HUD from './HUD'
import IdleScreen from './IdleScreen'
import GameOverScreen from './GameOverScreen'
import { useGameStore, ROUND1_LEVEL } from '@/store/store'

const GameCanvas = dynamic(() => import('./GameCanvas'), { ssr: false })

export default function Game() {
  const status     = useGameStore(s => s.status)
  const startGame  = useGameStore(s => s.startGame)
  const pauseGame  = useGameStore(s => s.pauseGame)
  const resumeGame = useGameStore(s => s.resumeGame)
  const resetGame  = useGameStore(s => s.resetGame)
  const tick       = useGameStore(s => s.tick)

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
        if (status === 'paused') resumeGame(); else pauseGame()
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

  // ── Screens ────────────────────────────────────────────────────
  if (status === 'idle') {
    return <IdleScreen onPlay={startGame} />
  }

  if (status === 'gameover') {
    return <GameOverScreen onPlayAgain={startGame} onMenu={resetGame} />
  }

  // Playing / Paused
  return (
    <div className="relative w-full h-dvh overflow-hidden bg-black">
      <GameCanvas />
      <HUD />
    </div>
  )
}
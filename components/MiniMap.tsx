'use client'
import { useEffect, useRef } from 'react'
import { useGameStore, ROUND1_LEVEL } from '@/store/store'

const MAP_PX   = 140   // canvas size in pixels
const PADDING  = 4     // px padding inside border

export default function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const snake = useGameStore(s => s.snake)
  const food  = useGameStore(s => s.food)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = ROUND1_LEVEL.size      // grid half-extent (15)
    const full = size * 2               // 30 cells
    const cellPx = (MAP_PX - PADDING * 2) / full

    const toScreen = (v: number) => PADDING + (v + size) * cellPx

    // Background
    ctx.clearRect(0, 0, MAP_PX, MAP_PX)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, MAP_PX, MAP_PX)

    // Grid (faint)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= full; i++) {
      const p = PADDING + i * cellPx
      ctx.beginPath(); ctx.moveTo(p, PADDING); ctx.lineTo(p, MAP_PX - PADDING); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(PADDING, p); ctx.lineTo(MAP_PX - PADDING, p); ctx.stroke()
    }

    // Wall border
    ctx.strokeStyle = '#7a7268'
    ctx.lineWidth = 2
    ctx.strokeRect(PADDING, PADDING, MAP_PX - PADDING * 2, MAP_PX - PADDING * 2)

    // Food
    food.forEach(f => {
      ctx.fillStyle = '#ffee44'
      ctx.beginPath()
      ctx.arc(toScreen(f.position.x) + cellPx / 2, toScreen(f.position.z) + cellPx / 2, cellPx * 0.45, 0, Math.PI * 2)
      ctx.fill()
    })

    // Snake body
    snake.slice(1).forEach(seg => {
      ctx.fillStyle = '#3a9e3a'
      ctx.fillRect(toScreen(seg.x) + 0.5, toScreen(seg.z) + 0.5, cellPx - 1, cellPx - 1)
    })

    // Snake head
    if (snake.length > 0) {
      const h = snake[0]
      ctx.fillStyle = '#88ff88'
      ctx.fillRect(toScreen(h.x) + 0.5, toScreen(h.z) + 0.5, cellPx - 1, cellPx - 1)
    }
  }, [snake, food])

  return (
    <canvas
      ref={canvasRef}
      width={MAP_PX}
      height={MAP_PX}
      className="rounded border border-white/20 shadow-lg"
    />
  )
}
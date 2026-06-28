'use client'
import { useState } from 'react'
import { useGameStore } from '@/store/store'
import type { SkyMode } from '@/store/store'
import { SNAKE_THEMES } from '@/lib/snakeTheme'

const SKY: { value: SkyMode; icon: string; label: string }[] = [
  { value: 'day',   icon: '☀',  label: 'Day'    },
  { value: 'night', icon: '☽',  label: 'Night'  },
  { value: 'auto',  icon: '⟳',  label: 'System' },
]

const CONTROLS = [
  { keys: 'A / ←',      action: 'Turn left'  },
  { keys: 'D / →',      action: 'Turn right' },
  { keys: 'W / ↑',      action: 'Forward'    },
  { keys: 'P / Esc',    action: 'Pause'      },
  { keys: 'drag',       action: 'Look'       },
]

export default function IdleScreen({ onPlay }: { onPlay: () => void }) {
  const snakeThemeIdx = useGameStore(s => s.snakeThemeIdx)
  const skyMode       = useGameStore(s => s.skyMode)
  const setSnakeTheme = useGameStore(s => s.setSnakeTheme)
  const setSkyMode    = useGameStore(s => s.setSkyMode)
  const highScore     = useGameStore(s => s.highScore)

  const [showControls, setShowControls] = useState(false)

  const activeTheme = SNAKE_THEMES[snakeThemeIdx]

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-slate-950 via-slate-900 to-slate-950 text-white select-none overflow-hidden">

      {/* Subtle vignette glow matching snake theme */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 60%, ${activeTheme.swatch}, transparent)`,
        }}
      />

      {/* ── Content column ───────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-xs px-6 gap-8">

        {/* Title */}
        <div className="flex flex-col items-center gap-1 pt-4">
          <h1 className="text-5xl font-bold font-mono tracking-tight">
            SNACK<span style={{ color: activeTheme.swatch }}>3D</span>
          </h1>
          <p className="text-white/30 font-mono text-[11px] tracking-[0.22em] uppercase">
            First-Person · Round 1
          </p>
          {highScore > 0 && (
            <p className="text-white/20 font-mono text-[10px] tracking-widest mt-1">
              Best&nbsp;&nbsp;{highScore}
            </p>
          )}
        </div>

        {/* ── Settings block ──────────────────────────────────────── */}
        <div className="w-full flex flex-col gap-5">

          {/* Snake color */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] tracking-[0.18em] text-white/40 uppercase">
                Snake
              </span>
              <span className="font-mono text-[11px] text-white/50">
                {activeTheme.label}
              </span>
            </div>
            <div className="flex gap-2 justify-between">
              {SNAKE_THEMES.map((theme, idx) => {
                const active = idx === snakeThemeIdx
                return (
                  <button
                    key={idx}
                    onClick={() => setSnakeTheme(idx)}
                    title={theme.label}
                    className="relative flex-1 aspect-square rounded-full transition-transform active:scale-90"
                    style={{ minWidth: 0 }}
                  >
                    {/* Swatch circle */}
                    <span
                      className="block w-full h-full rounded-full"
                      style={{
                        background: theme.swatch,
                        boxShadow: active
                          ? `0 0 0 2px #0f172a, 0 0 0 4px ${theme.swatch}, 0 0 12px 2px ${theme.swatch}66`
                          : '0 0 0 1.5px rgba(255,255,255,0.10)',
                      }}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sky / time of day */}
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-[0.18em] text-white/40 uppercase">
              Sky
            </span>
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              {SKY.map(opt => {
                const active = skyMode === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSkyMode(opt.value)}
                    className={[
                      'flex-1 flex items-center justify-center gap-1.5 py-2.5 font-mono text-xs font-semibold transition-colors',
                      active
                        ? 'bg-white/15 text-white'
                        : 'text-white/35 hover:text-white/60 hover:bg-white/5',
                    ].join(' ')}
                  >
                    <span className="text-sm leading-none">{opt.icon}</span>
                    <span className="tracking-wide">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/8" />

        {/* Play button */}
        <div className="w-full flex flex-col items-center gap-3">
          <button
            onClick={onPlay}
            className="w-full py-4 rounded-2xl font-mono font-bold text-lg tracking-widest uppercase transition-all active:scale-95 hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${activeTheme.swatch}cc, ${activeTheme.swatch})`,
              boxShadow: `0 0 28px 0 ${activeTheme.swatch}55`,
              color: '#fff',
            }}
          >
            Play
          </button>

          {/* Controls toggle */}
          <button
            onClick={() => setShowControls(v => !v)}
            className="font-mono text-[11px] text-white/25 hover:text-white/50 tracking-widest uppercase transition-colors"
          >
            {showControls ? '▴ Controls' : '▾ Controls'}
          </button>

          {/* Controls table — expandable */}
          {showControls && (
            <div className="w-full bg-white/5 rounded-xl px-4 py-3 flex flex-col gap-2">
              {CONTROLS.map(({ keys, action }) => (
                <div key={action} className="flex justify-between font-mono text-xs">
                  <span className="text-white/40">{action}</span>
                  <span className="text-white/70 font-semibold">{keys}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
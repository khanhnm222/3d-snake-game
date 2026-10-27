'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useGameStore } from '@/store/store'
import type { SkyMode } from '@/store/store'
import { SNAKE_THEMES } from '@/lib/snakeTheme'
import { useIsTouch } from '@/hooks/useIsTouch'
import ScreenShell from './ScreenShell'

const MenuScene = dynamic(() => import('./MenuScene'), { ssr: false })

const SKY: { value: SkyMode; icon: string; label: string }[] = [
  { value: 'day',   icon: '☀',  label: 'Day'    },
  { value: 'night', icon: '☽',  label: 'Night'  },
  { value: 'auto',  icon: '⟳',  label: 'System' },
]

const KEY_CONTROLS = [
  { keys: 'A / ←',   action: 'Turn left'  },
  { keys: 'D / →',   action: 'Turn right' },
  { keys: 'W / ↑',   action: 'Forward'    },
  { keys: 'P / Esc', action: 'Pause'      },
  { keys: 'drag',    action: 'Look'       },
]

const TOUCH_CONTROLS = [
  { keys: '◀ button / swipe ←', action: 'Turn left'  },
  { keys: '▶ button / swipe →', action: 'Turn right' },
  { keys: '❚❚ button',          action: 'Pause'      },
  { keys: 'slow drag',          action: 'Look'       },
]

export default function IdleScreen({ onPlay }: { onPlay: () => void }) {
  const snakeThemeIdx = useGameStore(s => s.snakeThemeIdx)
  const skyMode       = useGameStore(s => s.skyMode)
  const setSnakeTheme = useGameStore(s => s.setSnakeTheme)
  const setSkyMode    = useGameStore(s => s.setSkyMode)
  const highScore     = useGameStore(s => s.highScore)
  const touch         = useIsTouch()

  const [showControls, setShowControls] = useState(false)

  const activeTheme = SNAKE_THEMES[snakeThemeIdx]
  const controls    = touch ? TOUCH_CONTROLS : KEY_CONTROLS

  return (
    <ScreenShell scene={<MenuScene mode="menu" />} accent={activeTheme.swatch}>
      {/* Title */}
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-4xl sm:text-5xl font-bold font-mono tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
          SNAKE<span style={{ color: activeTheme.swatch }}>3D</span>
        </h1>
        <p className="text-white/45 font-mono text-[11px] tracking-[0.22em] uppercase">
          Dragon Garden · Round 1
        </p>
        {highScore > 0 && (
          <p className="text-white/35 font-mono text-[10px] tracking-widest mt-1">
            Best&nbsp;&nbsp;{highScore}
          </p>
        )}
      </div>

      {/* ── Settings ──────────────────────────────────────────────── */}
      <div className="w-full flex flex-col gap-5">
        {/* Snake colour — previewed live on the dragon behind */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.18em] text-white/50 uppercase">Dragon</span>
            <span className="font-mono text-[11px] text-white/70">{activeTheme.label}</span>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {SNAKE_THEMES.map((theme, idx) => {
              const active = idx === snakeThemeIdx
              return (
                <button
                  key={idx}
                  onClick={() => setSnakeTheme(idx)}
                  title={theme.label}
                  aria-label={theme.label}
                  aria-pressed={active}
                  className="relative aspect-square rounded-full transition-transform active:scale-90"
                >
                  <span
                    className="block w-full h-full rounded-full"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${theme.belly}, ${theme.swatch} 55%, ${theme.spine})`,
                      boxShadow: active
                        ? `0 0 0 2px #0f172a, 0 0 0 4px ${theme.swatch}, 0 0 14px 2px ${theme.swatch}88`
                        : '0 0 0 1.5px rgba(255,255,255,0.12)',
                    }}
                  />
                </button>
              )
            })}
          </div>
        </div>

        {/* Sky */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] tracking-[0.18em] text-white/50 uppercase">Sky</span>
          <div className="flex rounded-xl overflow-hidden border border-white/10 bg-black/20">
            {SKY.map(opt => {
              const active = skyMode === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setSkyMode(opt.value)}
                  aria-pressed={active}
                  className={[
                    'flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-xs font-semibold transition-colors',
                    active ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white/70 hover:bg-white/5',
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

      {/* ── Play ──────────────────────────────────────────────────── */}
      <div className="w-full flex flex-col items-center gap-3">
        <button
          onClick={onPlay}
          className="w-full py-4 rounded-2xl font-mono font-bold text-lg tracking-widest uppercase transition-all active:scale-95 hover:brightness-110"
          style={{
            background: `linear-gradient(135deg, ${activeTheme.swatch}cc, ${activeTheme.swatch})`,
            boxShadow: `0 0 28px 0 ${activeTheme.swatch}66`,
            color: '#fff',
          }}
        >
          Play
        </button>

        <button
          onClick={() => setShowControls(v => !v)}
          className="font-mono text-[11px] text-white/40 hover:text-white/70 tracking-widest uppercase transition-colors py-1"
        >
          {showControls ? '▴ Controls' : '▾ Controls'}
        </button>

        {showControls && (
          <div className="w-full bg-black/25 rounded-xl px-4 py-3 flex flex-col gap-2">
            {controls.map(({ keys, action }) => (
              <div key={action} className="flex justify-between gap-4 font-mono text-xs">
                <span className="text-white/50">{action}</span>
                <span className="text-white/80 font-semibold text-right">{keys}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScreenShell>
  )
}
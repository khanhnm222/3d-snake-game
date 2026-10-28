'use client'
import type { ReactNode } from 'react'

// Shared layout for the menu / game-over screens.
//   Stacked (phone, and tablets held in portrait): 3D diorama across the
//   top, glass card below (scrolls if short).
//   Side-by-side (landscape, once there's width to spare): diorama fills
//   the screen, card floats on the right.
// The side-by-side layout is gated on `landscape` (not just `md`) because a
// portrait tablet is `md`-or-wider but has no spare horizontal room — the
// camera framing in MenuScene keys off the same aspect-ratio signal, so the
// two must move together or the scene composition and card placement fight.
export default function ScreenShell({ scene, accent, tint = 'slate', children }: {
  scene: ReactNode
  accent: string
  tint?: 'slate' | 'red'
  children: ReactNode
}) {
  const base = tint === 'red' ? 'bg-[#12060a]' : 'bg-slate-950'
  const fadeTo = tint === 'red' ? 'to-[#12060a]' : 'to-slate-950'
  return (
    <div className={`relative h-dvh w-full overflow-hidden ${base} text-white select-none`}>
      {/* 3D diorama */}
      <div className="absolute inset-x-0 top-0 h-[46dvh] sm:h-[50dvh] md:landscape:inset-0 md:landscape:h-full">
        {scene}
        {/* Stacked: blend the scene into the card area */}
        <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-b from-transparent ${fadeTo} md:landscape:hidden`} />
      </div>
      {/* Side-by-side: darken behind the card for legibility */}
      <div className="pointer-events-none absolute inset-0 hidden md:landscape:block bg-linear-to-l from-black/60 via-black/10 to-transparent" />

      <div className="relative z-10 flex h-full flex-col md:landscape:flex-row md:landscape:items-center md:landscape:justify-end">
        {/* Stacked: leave the top of the screen to the diorama */}
        <div className="h-[38dvh] sm:h-[42dvh] shrink-0 md:landscape:hidden" />
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:landscape:flex-none md:landscape:overflow-visible md:landscape:w-100 md:landscape:mr-[6vw] md:landscape:px-0 md:landscape:pb-0">
          <div
            className="mx-auto flex w-full max-w-sm sm:max-w-md md:landscape:max-w-sm flex-col items-center gap-6 rounded-3xl border border-white/10 bg-slate-950/65 p-8 sm:p-6 backdrop-blur-md"
            style={{ boxShadow: `0 20px 60px -20px ${accent}55, inset 0 1px 0 rgba(255,255,255,0.06)` }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

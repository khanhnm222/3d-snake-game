'use client'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import SceneSetup    from './scene/SceneSetup'
import Ground        from './scene/Ground'
import Walls         from './scene/Walls'
import MapObjects    from './scene/MapObjects'
import Obstacles     from './scene/Obstacles'
import FoodItems     from './scene/FoodItems'
import EatEffect     from './scene/EatEffect'
import SnakeRenderer from './scene/SnakeRenderer'
import Fireflies     from './scene/objects/Fireflies'
import SkyObjects    from './scene/SkyObjects'
import { useNightMode } from '@/hooks/useNightMode'
import { useIsTouch } from '@/hooks/useIsTouch'
import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/store'
import { drag, freeLook, SENS_X, SENS_Y, PITCH_MIN, PITCH_MAX } from '@/configs/cameraControls'
import type { PointerEvent } from 'react'

// Touch: a quick flick turns the snake; holding and dragging looks around.
const SWIPE_MIN_PX  = 35
const LOOK_DELAY_MS = 200
const touchStart = { x: 0, y: 0, t: 0, active: false }

function onPointerDown(e: PointerEvent<HTMLDivElement>) {
  drag.lastX = e.clientX
  drag.lastY = e.clientY
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  if (e.pointerType === 'touch') {
    // Don't start looking yet — this might be a swipe
    touchStart.x = e.clientX; touchStart.y = e.clientY; touchStart.t = e.timeStamp; touchStart.active = true
    drag.active = false
  } else {
    drag.active = true
  }
}

function onPointerMove(e: PointerEvent<HTMLDivElement>) {
  if (e.pointerType === 'touch' && touchStart.active && !drag.active && e.timeStamp - touchStart.t > LOOK_DELAY_MS) {
    drag.active = true     // held long enough → it's a look-drag
    drag.lastX = e.clientX
    drag.lastY = e.clientY
  }
  if (!drag.active) return
  const dx = e.clientX - drag.lastX
  const dy = e.clientY - drag.lastY
  drag.lastX = e.clientX
  drag.lastY = e.clientY
  freeLook.yaw  -= dx * SENS_X
  freeLook.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, freeLook.pitch - dy * SENS_Y))
}

function onPointerUp(e: PointerEvent<HTMLDivElement>) {
  if (e.pointerType === 'touch' && touchStart.active && !drag.active) {
    const dx = e.clientX - touchStart.x
    const dy = e.clientY - touchStart.y
    if (Math.abs(dx) > SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.3) {
      const { queueTurnLeft, queueTurnRight } = useGameStore.getState()
      if (dx > 0) queueTurnRight(); else queueTurnLeft()
    }
  }
  touchStart.active = false
  drag.active = false
}

// Wider vertical FOV on portrait screens so a phone isn't looking through a slit
function portraitFov(): number {
  if (typeof window === 'undefined') return 75
  const aspect = window.innerWidth / window.innerHeight
  return aspect >= 1 ? 75 : Math.min(100, 75 / Math.pow(aspect, 0.45))
}

function useResponsiveFov(): number {
  const [fov, setFov] = useState(portraitFov)
  useEffect(() => {
    const onResize = () => setFov(portraitFov())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return fov
}

export default function GameCanvas() {
  const systemDark = useNightMode()
  const skyMode    = useGameStore(s => s.skyMode)
  const darkMode   = skyMode === 'auto' ? systemDark : skyMode === 'night'
  const touch      = useIsTouch()
  const fov        = useResponsiveFov()

  return (
    <div
      style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={e => e.preventDefault()}
    >
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
        dpr={[1, touch ? 1.25 : 1.5]}
      >
        <PerspectiveCamera makeDefault fov={fov} near={0.1} far={60} position={[0, 1.0, 3]} />
        <SceneSetup darkMode={darkMode} lowPower={touch} />
        <SkyObjects darkMode={darkMode} />
        <Ground />
        <Walls />
        <MapObjects />
        <Obstacles />
        <FoodItems />
        <EatEffect />
        <SnakeRenderer />
        <Fireflies />
      </Canvas>
    </div>
  )
}
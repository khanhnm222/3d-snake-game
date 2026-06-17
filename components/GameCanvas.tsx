'use client'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import SceneSetup    from './scene/SceneSetup'
import Ground        from './scene/Ground'
import Walls         from './scene/Walls'
import MapObjects    from './scene/MapObjects'
import FoodItems     from './scene/FoodItems'
import EatEffect     from './scene/EatEffect'
import SnakeRenderer from './scene/SnakeRenderer'
import Fireflies     from './scene/objects/Fireflies'
import SkyObjects    from './scene/SkyObjects'
import { useNightMode } from '@/hooks/useNightMode'
import { useGameStore } from '@/store/store'
import { drag, freeLook, SENS_X, SENS_Y, PITCH_MIN, PITCH_MAX } from '@/configs/cameraControls'
import type { PointerEvent } from 'react'

function onPointerDown(e: PointerEvent<HTMLDivElement>) {
  drag.active = true
  drag.lastX  = e.clientX
  drag.lastY  = e.clientY
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent<HTMLDivElement>) {
  if (!drag.active) return
  const dx = e.clientX - drag.lastX
  const dy = e.clientY - drag.lastY
  drag.lastX = e.clientX
  drag.lastY = e.clientY
  freeLook.yaw  -= dx * SENS_X
  freeLook.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, freeLook.pitch - dy * SENS_Y))
}

function onPointerUp() {
  drag.active = false
}

export default function GameCanvas() {
  const systemDark = useNightMode()
  const skyMode    = useGameStore(s => s.skyMode)
  const darkMode   = skyMode === 'auto' ? systemDark : skyMode === 'night'

  return (
    <div
      style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onContextMenu={e => e.preventDefault()}
    >
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
        dpr={[1, 1.5]}
      >
        <PerspectiveCamera makeDefault fov={75} near={0.1} far={60} position={[0, 1.0, 3]} />
        <SceneSetup darkMode={darkMode} />
        <SkyObjects darkMode={darkMode} />
        <Ground />
        <Walls />
        <MapObjects />
        <FoodItems />
        <EatEffect />
        <SnakeRenderer />
        <Fireflies />
      </Canvas>
    </div>
  )
}
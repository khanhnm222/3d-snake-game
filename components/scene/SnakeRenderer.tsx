'use client'
import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/store'
import { ROUND1_LEVEL } from '@/store/store'
import { SNAKE_THEMES } from '@/lib/snakeTheme'
import SnakeHead from './SnakeHead'
import GroundShadow from './objects/GroundShadow'
import { SnakeTube } from './snakeTube'
import { terrainHeight } from '@/utils/terrain'
import type { Direction } from '@/types'
import { freeLook, drag } from '@/configs/cameraControls'

// ── Module-level constants (never allocate inside useFrame) ──────────
const _camTarget  = new THREE.Vector3()
const _lookTarget = new THREE.Vector3()
const _lookDir    = new THREE.Vector3()
const _right      = new THREE.Vector3()
const _up         = new THREE.Vector3(0, 1, 0)
const _quat       = new THREE.Quaternion()
const _euler      = new THREE.Euler(0, 0, 0, 'YXZ')   // yaw first, then pitch

const HEAD_Y = 0.25   // head centre above the ground

// Contact-shadow size per segment — shrinks along the tapering tail
function blobScale(i: number, n: number): number {
  const fromTail = n - 1 - i
  return fromTail === 0 ? 0.45 : fromTail === 1 ? 0.62 : fromTail === 2 ? 0.8 : 1
}

const DIR_ANGLE: Record<Direction, number> = {
  north:  0,
  east:  -Math.PI / 2,
  south:  Math.PI,
  west:   Math.PI / 2,
}

// ── Per-frame interpolation state ────────────────────────────────────
interface VisPos { x: number; z: number }

export default function SnakeRenderer() {
  const { camera } = useThree()

  const headRef    = useRef<THREE.Group>(null)
  const blobRefs   = useRef<(THREE.Group | null)[]>([])
  const visPos     = useRef<VisPos[]>([])
  const lookSmooth = useRef(new THREE.Vector3(0, 0.38, -4))
  const rollSmooth = useRef(0)
  const lastDir    = useRef('north')
  const camAngle   = useRef(0)
  const snapCam    = useRef(true)

  const themeIdx = useGameStore(s => s.snakeThemeIdx)
  const theme    = useMemo(() => SNAKE_THEMES[themeIdx] ?? SNAKE_THEMES[0], [themeIdx])
  const tube     = useMemo(() => new SnakeTube(), [])
  useEffect(() => { tube.setTheme(theme) }, [tube, theme])
  useEffect(() => () => tube.dispose(), [tube])

  useFrame(({ clock }, delta) => {
    const { snake, direction, status } = useGameStore.getState()
    if (status !== 'playing' || snake.length < 2) {
      snapCam.current = true
      return
    }

    // 1. Grow / shrink visual position cache to match snake length.
    //    A big jump means the snake respawned — snap instead of flying across.
    const vp = visPos.current
    if (vp.length && Math.hypot(vp[0].x - snake[0].x, vp[0].z - snake[0].z) > 2.5) vp.length = 0
    while (vp.length < snake.length) {
      const s = snake[vp.length]
      vp.push({ x: s.x, z: s.z })
    }
    vp.length = snake.length

    // 2. Lerp visual positions toward logical grid positions
    const lf = 1 - Math.pow(0.001, delta)
    snake.forEach((seg, i) => {
      vp[i].x = THREE.MathUtils.lerp(vp[i].x, seg.x, lf)
      vp[i].z = THREE.MathUtils.lerp(vp[i].z, seg.z, lf)
    })

    // 3a. Head — rides the terrain and pitches up / down slopes
    const head = vp[0]
    const headH = terrainHeight(head.x, head.z)
    const g = headRef.current
    if (g) {
      const yaw = DIR_ANGLE[direction as Direction]
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw)       // head faces −Z at yaw 0
      const ahead  = terrainHeight(head.x + fx * 0.45, head.z + fz * 0.45)
      const behind = terrainHeight(head.x - fx * 0.45, head.z - fz * 0.45)
      g.position.set(head.x, HEAD_Y + headH, head.z)
      _euler.set(Math.atan2(ahead - behind, 0.9), yaw, 0)
      _quat.setFromEuler(_euler)
      g.quaternion.slerp(_quat, 1 - Math.pow(0.001, delta))
    }

    // 3b. Continuous body tube along the smoothed path
    tube.update(vp, clock.elapsedTime)

    // 3c. Contact shadows — only on flat ground (the shadow map handles slopes)
    vp.forEach((p, i) => {
      const b = blobRefs.current[i]
      if (!b) return
      const h = terrainHeight(p.x, p.z)
      b.position.set(p.x, h + 0.006, p.z)
      b.visible = h < 0.015
    })

    // 4. Camera — riding the snake ─────────────────────────────────
    const bobHz = 1.0 / (ROUND1_LEVEL.speed / 1000)
    const bob   = Math.sin(clock.elapsedTime * bobHz * Math.PI) * 0.028
    const sway  = Math.sin(clock.elapsedTime * bobHz * Math.PI * 0.5) * 0.012

    if (direction !== lastDir.current) {
      const l = lastDir.current, d = direction
      const turningLeft =
        (l === 'north' && d === 'west') || (l === 'west' && d === 'south') ||
        (l === 'south' && d === 'east') || (l === 'east' && d === 'north')
      rollSmooth.current = turningLeft ? 0.11 : -0.11
      lastDir.current = direction
    }
    rollSmooth.current *= Math.pow(0.04, delta)

    const targetAngle = DIR_ANGLE[direction as Direction]
    let da = (targetAngle - camAngle.current) % (Math.PI * 2)
    if (da > Math.PI)  da -= Math.PI * 2
    if (da < -Math.PI) da += Math.PI * 2
    camAngle.current += da * (1 - Math.pow(0.001, delta))

    const pullback = 1.5
    const camX = head.x + Math.sin(camAngle.current) * pullback
    const camZ = head.z + Math.cos(camAngle.current) * pullback
    _camTarget.set(camX + sway, 1.5 + bob + headH, camZ)

    if (snapCam.current) {
      camAngle.current = targetAngle
      _camTarget.set(
        head.x + Math.sin(targetAngle) * pullback + sway,
        1.5 + bob + headH,
        head.z + Math.cos(targetAngle) * pullback,
      )
      camera.position.copy(_camTarget)
      lookSmooth.current.set(head.x, 0.4 + headH, head.z)
      snapCam.current = false
    } else {
      camera.position.lerp(_camTarget, 1 - Math.pow(0.005, delta))
    }

    _lookDir.set(-Math.sin(camAngle.current), 0, -Math.cos(camAngle.current)).normalize()
    _right.crossVectors(_lookDir, _up).normalize()
    _lookDir.applyAxisAngle(_up, freeLook.yaw)
    _right.applyAxisAngle(_up, freeLook.yaw)
    _lookDir.applyAxisAngle(_right, freeLook.pitch)
    _lookTarget.copy(camera.position).addScaledVector(_lookDir, 10)
    _lookTarget.y -= 1.1

    const lookSpeed = drag.active ? 1 - Math.pow(0.0001, delta) : 1 - Math.pow(0.008, delta)
    lookSmooth.current.lerp(_lookTarget, lookSpeed)
    camera.up.set(rollSmooth.current, 1, 0).normalize()
    camera.lookAt(lookSmooth.current)

    if (!drag.active) {
      const d = Math.pow(0.004, delta)
      freeLook.yaw   *= d
      freeLook.pitch *= d
    }
  })

  // Only the segment count drives React; transforms are written in useFrame
  const n = useGameStore(s => s.snake.length)

  return (
    <>
      <group ref={headRef}>
        <SnakeHead theme={theme} />
      </group>

      <primitive object={tube.group} />

      {Array.from({ length: n }, (_, i) => (
        <group key={i} ref={el => { blobRefs.current[i] = el }}>
          <GroundShadow
            radius={0.52 * blobScale(i, n)}
            stretch={i === 0 ? 1.6 : 1.25}
            opacity={0.5}
            y={0}
          />
        </group>
      ))}
    </>
  )
}

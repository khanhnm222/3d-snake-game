'use client'
import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/store'
import { ROUND1_LEVEL } from '@/store/store'
import { SNAKE_THEMES } from '@/lib/snackTheme'
import SnakeHead from './SnakeHead'
import type { Direction } from '@/types'
import { freeLook, drag } from '@/configs/cameraControls'

// ── Module-level constants (never allocate inside useFrame) ──────────
const _camTarget  = new THREE.Vector3()
const _lookTarget = new THREE.Vector3()
const _lookDir    = new THREE.Vector3()
const _right      = new THREE.Vector3()
const _up         = new THREE.Vector3(0, 1, 0)
const _quat       = new THREE.Quaternion()
const _euler      = new THREE.Euler()

const DIR_ANGLE: Record<Direction, number> = {
  north:  0,
  east:  -Math.PI / 2,
  south:  Math.PI,
  west:   Math.PI / 2,
}

// ── Body segment — smooth capsule cross-section ──────────────────────
// capsuleGeometry(radius, length, capSeg, radialSeg)
// radialSeg=16 → perfectly circular cross-section
function BodySeg({
  colorIdx, s = 1, body, spine, belly,
}: {
  colorIdx: number
  s?: number
  body: [string, string, string]
  spine: string
  belly: string
}) {
  return (
    <group scale={[s, s * 0.68, s]}>
      {/* Main pill — high-res capsule for smooth silhouette */}
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.41, 0.26, 8, 16]} />
        <meshStandardMaterial
          color={body[colorIdx % 3]}
          roughness={0.38}
          metalness={0.06}
        />
      </mesh>

      {/* Spine ridge — thin rounded cylinder instead of box */}
      <mesh castShadow position={[0, 0.33, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.028, 0.88, 10]} />
        <meshStandardMaterial color={spine} roughness={0.5} />
      </mesh>

      {/* Belly stripe — wide flat capsule for organic look */}
      <mesh position={[0, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.19, 0.64, 4, 8]} />
        <meshStandardMaterial color={belly} roughness={0.6} />
      </mesh>
    </group>
  )
}

// ── Tail tip — smooth tapered cone ───────────────────────────────────
function TailTip({
  s = 0.65, spine, body,
}: {
  s?: number
  spine: string
  body: [string, string, string]
}) {
  return (
    <group scale={[s, s * 0.52, s]}>
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.42, 1.1, 16]} />
        <meshStandardMaterial color={body[2]} roughness={0.55} metalness={0.04} />
      </mesh>
      <mesh position={[0, 0.44, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.008, 0.55, 8]} />
        <meshStandardMaterial color={spine} roughness={0.5} />
      </mesh>
    </group>
  )
}

// ── Per-frame interpolation state ────────────────────────────────────
interface VisPos { x: number; z: number }

export default function SnakeRenderer() {
  const { camera } = useThree()

  const segRefs    = useRef<(THREE.Group | null)[]>([])
  const visPos     = useRef<VisPos[]>([])
  const lookSmooth = useRef(new THREE.Vector3(0, 0.38, -4))
  const rollSmooth = useRef(0)
  const lastDir    = useRef('north')
  const camAngle   = useRef(0)
  const snapCam    = useRef(true)

  useFrame(({ clock }, delta) => {
    const { snake, direction, status } = useGameStore.getState()
    if (status !== 'playing' || snake.length < 2) {
      snapCam.current = true
      return
    }

    // 1. Grow / shrink visual position cache to match snake length
    while (visPos.current.length < snake.length) {
      const s = snake[visPos.current.length]
      visPos.current.push({ x: s.x, z: s.z })
    }
    visPos.current.length = snake.length

    // 2. Lerp visual positions toward logical grid positions
    const lf = 1 - Math.pow(0.001, delta)
    snake.forEach((seg, i) => {
      visPos.current[i].x = THREE.MathUtils.lerp(visPos.current[i].x, seg.x, lf)
      visPos.current[i].z = THREE.MathUtils.lerp(visPos.current[i].z, seg.z, lf)
    })

    // 3. Push positions + rotations directly to Three.js objects
    snake.forEach((_, i) => {
      const g = segRefs.current[i]
      if (!g) return

      g.position.x = visPos.current[i].x
      g.position.z = visPos.current[i].z

      if (i === 0) {
        _euler.set(0, DIR_ANGLE[direction as Direction], 0)
        _quat.setFromEuler(_euler)
        g.quaternion.slerp(_quat, 1 - Math.pow(0.001, delta))
      } else {
        const prev = visPos.current[i - 1]
        const dx = prev.x - visPos.current[i].x
        const dz = prev.z - visPos.current[i].z
        if (Math.sqrt(dx * dx + dz * dz) > 0.05) {
          _euler.set(0, Math.atan2(-dx, -dz), 0)
          _quat.setFromEuler(_euler)
          g.quaternion.slerp(_quat, 1 - Math.pow(0.001, delta))
        }
      }
    })

    // 4. Camera — riding the snake ─────────────────────────────────
    const head = visPos.current[0]

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
    _camTarget.set(camX + sway, 1.5 + bob, camZ)

    if (snapCam.current) {
      camAngle.current = targetAngle
      _camTarget.set(
        head.x + Math.sin(targetAngle) * pullback + sway,
        1.5 + bob,
        head.z + Math.cos(targetAngle) * pullback,
      )
      camera.position.copy(_camTarget)
      lookSmooth.current.set(head.x, 0.4, head.z)
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

  const snake        = useGameStore(s => s.snake)
  const direction    = useGameStore(s => s.direction)
  const themeIdx     = useGameStore(s => s.snakeThemeIdx)
  const theme        = useMemo(() => SNAKE_THEMES[themeIdx] ?? SNAKE_THEMES[0], [themeIdx])
  const n            = snake.length

  return (
    <>
      {snake.map((seg, i) => {
        const distFromTail = n - 1 - i

        const tailScale =
          distFromTail === 0 ? 0.62
          : distFromTail === 1 ? 0.78
          : distFromTail === 2 ? 0.90
          : 1.0

        return (
          <group
            key={i}
            ref={el => { segRefs.current[i] = el }}
            position={[seg.x, 0.25, seg.z]}
            rotation={i === 0 ? [0, DIR_ANGLE[direction], 0] : [0, 0, 0]}
          >
            {i === 0 ? (
              <SnakeHead theme={theme} />
            ) : distFromTail === 0 ? (
              <TailTip s={tailScale} spine={theme.spine} body={theme.body} />
            ) : (
              <BodySeg colorIdx={i} s={tailScale} body={theme.body} spine={theme.spine} belly={theme.belly} />
            )}
          </group>
        )
      })}
    </>
  )
}
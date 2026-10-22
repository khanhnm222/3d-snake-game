'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { pr, radialTexture } from './procedural'

const COUNT = 18

// All firefly data computed once at module level — never inside render
const FLIES = Array.from({ length: COUNT }, (_, i) => ({
  x:      (pr(i, 1) * 2 - 1) * 11.5,
  baseY:  0.4 + pr(i, 2) * 1.9,
  z:      (pr(i, 3) * 2 - 1) * 11.5,
  phase:  pr(i, 4) * Math.PI * 2,
  speed:  0.22 + pr(i, 5) * 0.32,
  radius: 0.25 + pr(i, 6) * 0.65,
  // Flash rhythm: each fly has its own cycle length and offset
  period: 2.2 + pr(i, 7) * 2.4,
  offset: pr(i, 8) * 5,
  double: pr(i, 9) > 0.6,          // some species flash twice per cycle
}))

// Real fireflies don't pulse sinusoidally — they give short bright flashes
// separated by dark pauses. Returns 0‥1 brightness.
function flash(t: number, period: number, double: boolean): number {
  const k = (t % period) / period
  const pulse = (c: number, w: number) => {
    const d = Math.abs(k - c) / w
    return d < 1 ? Math.pow(1 - d * d, 2) : 0
  }
  return Math.max(pulse(0.15, 0.08), double ? pulse(0.32, 0.06) * 0.8 : 0)
}

// Pre-allocate to avoid creating objects in useFrame
const _pos  = new THREE.Vector3()
const _prev = new THREE.Vector3()

export default function Fireflies() {
  const groupRefs = useRef<(THREE.Group | null)[]>([])
  const lanternRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const haloRefs = useRef<(THREE.Sprite | null)[]>([])
  const glow = useMemo(() => radialTexture(), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    FLIES.forEach((f, i) => {
      const g = groupRefs.current[i]
      if (!g) return
      const ft = t * f.speed + f.phase
      _pos.set(
        f.x + Math.sin(ft * 0.7) * f.radius + Math.sin(ft * 2.3) * 0.05,
        f.baseY + Math.sin(ft * 1.3) * 0.28,
        f.z + Math.cos(ft * 0.6) * f.radius + Math.cos(ft * 1.9) * 0.05,
      )
      // Face the direction of travel
      _prev.copy(g.position)
      g.position.copy(_pos)
      if (_prev.distanceToSquared(_pos) > 1e-8) {
        g.rotation.y = Math.atan2(_pos.x - _prev.x, _pos.z - _prev.z)
      }

      const b = flash(t + f.offset, f.period, f.double)
      const lantern = lanternRefs.current[i]
      if (lantern) lantern.emissiveIntensity = 0.25 + b * 3.2
      const halo = haloRefs.current[i]
      if (halo) {
        const s = 0.12 + b * 0.32
        halo.scale.set(s, s, s)
        ;(halo.material as THREE.SpriteMaterial).opacity = 0.08 + b * 0.75
      }
    })
  })

  return (
    <>
      {FLIES.map((f, i) => (
        <group
          key={i}
          ref={el => { groupRefs.current[i] = el }}
          position={[f.x, f.baseY, f.z]}
        >
          {/* Dark body + head */}
          <mesh position={[0, 0, 0.012]} scale={[0.012, 0.011, 0.022]}>
            <sphereGeometry args={[1, 6, 5]} />
            <meshStandardMaterial color="#2a1e14" roughness={0.6} />
          </mesh>
          {/* Glowing lantern (abdomen) */}
          <mesh position={[0, -0.002, -0.018]} scale={[0.014, 0.012, 0.022]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial
              ref={el => { lanternRefs.current[i] = el }}
              color="#e8ffb0"
              emissive="#aaff44"
              emissiveIntensity={0.8}
              toneMapped={false}
            />
          </mesh>
          {/* Translucent wings */}
          {([-1, 1] as const).map(side => (
            <mesh key={side} position={[side * 0.013, 0.01, 0.004]} rotation={[0.2, 0, side * 0.5]} scale={[0.016, 0.002, 0.026]}>
              <sphereGeometry args={[1, 6, 4]} />
              <meshStandardMaterial color="#d8e0e8" transparent opacity={0.45} roughness={0.2} depthWrite={false} />
            </mesh>
          ))}
          {/* Soft glow halo (additive, always faces the camera) */}
          <sprite ref={el => { haloRefs.current[i] = el }} position={[0, -0.002, -0.018]} scale={0.2}>
            <spriteMaterial
              map={glow}
              color="#b8ff5a"
              transparent
              opacity={0.3}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        </group>
      ))}
    </>
  )
}

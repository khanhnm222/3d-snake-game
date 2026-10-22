'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { bladeGeometry, pr } from './procedural'
import GroundShadow from './GroundShadow'

const COLORS = ['#5aa844', '#4c9a38', '#6ab850']
const BLADE_COUNT = 16

interface Props {
  position: [number, number, number]
  scale?: number
  rotation?: number
  variant?: number
}

// Dense clump of tapered, curved blades that sway in the wind.
export default function GrassTuft({ position, scale = 1, rotation = 0, variant = 0 }: Props) {
  const col  = COLORS[variant % COLORS.length]
  const seed = Math.round(rotation * 100) + variant * 3
  const bladeRefs = useRef<(THREE.Group | null)[]>([])

  const blades = useMemo(() => Array.from({ length: BLADE_COUNT }, (_, i) => {
    const a = pr(seed + i, 1) * Math.PI * 2
    const r = Math.sqrt(pr(seed + i, 2)) * 0.09
    const h = 0.22 + pr(seed + i, 3) * 0.22
    return {
      x: Math.cos(a) * r,
      z: Math.sin(a) * r,
      yaw: a + (pr(seed + i, 4) - 0.5) * 1.2,   // mostly bending outward
      lean: 0.1 + pr(seed + i, 5) * 0.3,
      phase: pr(seed + i, 6) * Math.PI * 2,
      geo: bladeGeometry(h, 0.045 + pr(seed + i, 7) * 0.025, 0.25 + pr(seed + i, 8) * 0.35),
      color: new THREE.Color(col).multiplyScalar(0.8 + pr(seed + i, 9) * 0.35),
    }
  }), [seed, col])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 1.6
    blades.forEach((b, i) => {
      const g = bladeRefs.current[i]
      if (g) g.rotation.x = b.lean + Math.sin(t + b.phase + position[0] * 0.3) * 0.07
    })
  })

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <GroundShadow radius={0.28} opacity={0.38} y={0.006 / scale} />
      {blades.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]} rotation={[0, b.yaw, 0]}>
          <group ref={el => { bladeRefs.current[i] = el }} rotation={[b.lean, 0, 0]}>
            <mesh geometry={b.geo} castShadow receiveShadow>
              <meshStandardMaterial color={b.color} vertexColors roughness={0.75} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

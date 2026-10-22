'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { foliageGeometry, stemGeometry, barkTexture, pr } from './procedural'
import GroundShadow from './GroundShadow'

const TRUNK_COLORS  = ['#7a5238', '#86603e', '#6a4630']
// Three tones per variant: shaded inner / body / sunlit outer
const CANOPY_COLORS = [
  ['#1e5a1c', '#2c7a26', '#4a9a34'],
  ['#245e20', '#337f2a', '#58a83c'],
  ['#1a5018', '#286c22', '#3f8a30'],
]

interface Props {
  position: [number, number, number]
  scale?: number
  rotation?: number
  variant?: number
}

export default function Tree({ position, scale = 1, rotation = 0, variant = 0 }: Props) {
  const trunkCol = TRUNK_COLORS[variant % TRUNK_COLORS.length]
  const leaves   = CANOPY_COLORS[variant % CANOPY_COLORS.length]
  const seed     = Math.round(rotation * 100) + variant * 11
  const canopyRef = useRef<THREE.Group>(null)

  const { trunk, branches, clumps, roots, bark } = useMemo(() => {
    const trunk = stemGeometry(1.35, 0.16, 0.08, -0.05, 12, 10)

    // Main limbs leaving the upper trunk
    const branches = [0, 1, 2, 3].map(i => {
      const a = (i / 4) * Math.PI * 2 + pr(seed + i, 1) * 0.8
      const len = 0.55 + pr(seed + i, 2) * 0.25
      return {
        a, y: 0.85 + pr(seed + i, 3) * 0.35,
        geo: stemGeometry(len, 0.055, 0.35, 0, 6, 6).geometry,
        tilt: 0.7 + pr(seed + i, 4) * 0.35,
      }
    })

    // Foliage clumps: big central mass plus satellites, lower ones darker
    const clumps: { p: [number, number, number]; s: [number, number, number]; tone: number; geo: THREE.BufferGeometry }[] = [
      { p: [0.05, 1.75, 0], s: [1.35, 1.1, 1.3], tone: 1, geo: foliageGeometry(seed) },
      { p: [0, 2.28, 0.05], s: [0.9, 0.8, 0.9], tone: 2, geo: foliageGeometry(seed + 1) },
    ]
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + pr(seed + i, 5)
      const r = 0.55 + pr(seed + i, 6) * 0.2
      const y = 1.45 + pr(seed + i, 7) * 0.65
      const s = 0.6 + pr(seed + i, 8) * 0.3
      clumps.push({
        p: [Math.cos(a) * r, y, Math.sin(a) * r],
        s: [s, s * 0.85, s],
        tone: y > 1.8 ? 2 : 0,
        geo: foliageGeometry(seed + 2 + i),
      })
    }

    // Root flare — short stubby tubes spreading out at the base
    const roots = [0, 1, 2, 3, 4].map(i => ({
      a: (i / 5) * Math.PI * 2 + pr(seed + i, 9) * 0.5,
      geo: stemGeometry(0.32, 0.07, 0.3, 0, 5, 6).geometry,
    }))

    return { trunk, branches, clumps, roots, bark: barkTexture() }
  }, [seed])

  // Gentle canopy sway in the breeze
  useFrame(({ clock }) => {
    const g = canopyRef.current
    if (!g) return
    const t = clock.elapsedTime + seed
    g.rotation.z = Math.sin(t * 0.7) * 0.018
    g.rotation.x = Math.sin(t * 0.53 + 1.3) * 0.014
  })

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <GroundShadow radius={1.25} opacity={0.5} y={0.006 / scale} />

      {/* Trunk */}
      <mesh geometry={trunk.geometry} castShadow receiveShadow>
        <meshStandardMaterial color={trunkCol} map={bark} bumpMap={bark} bumpScale={2.5} roughness={0.96} />
      </mesh>

      {/* Root flare */}
      {roots.map((r, i) => (
        <group key={`root${i}`} rotation={[0, -r.a, 0]}>
          <mesh geometry={r.geo} position={[0, 0.14, 0]} rotation={[0, 0, -1.72]} castShadow receiveShadow>
            <meshStandardMaterial color={trunkCol} map={bark} roughness={0.97} />
          </mesh>
        </group>
      ))}

      <group ref={canopyRef}>
        {/* Limbs */}
        {branches.map((b, i) => (
          <group key={`br${i}`} position={[trunk.top.x * (b.y / 1.35), b.y, trunk.top.z * (b.y / 1.35)]} rotation={[0, -b.a, 0]}>
            <mesh geometry={b.geo} rotation={[0, 0, -b.tilt]} castShadow receiveShadow>
              <meshStandardMaterial color={trunkCol} map={bark} roughness={0.95} />
            </mesh>
          </group>
        ))}

        {/* Foliage */}
        {clumps.map((c, i) => (
          <mesh key={`c${i}`} geometry={c.geo} position={c.p} scale={c.s} rotation={[0, i * 1.3, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={leaves[c.tone]} vertexColors roughness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
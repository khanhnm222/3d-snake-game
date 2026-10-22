'use client'
import { useMemo } from 'react'
import { rockGeometry, pr } from './procedural'
import GroundShadow from './GroundShadow'

const COLORS    = ['#8a8278', '#948a7c', '#77706a']
const SECONDARY = ['#6e665e', '#7a7064', '#5e5750']

interface Props {
  position: [number, number, number]
  scale?: number
  rotation?: number
  variant?: number
}

export default function Rock({ position, scale = 1, rotation = 0, variant = 0 }: Props) {
  const col  = COLORS[variant % COLORS.length]
  const col2 = SECONDARY[variant % SECONDARY.length]

  // Seed from the rotation so every rock in the map has its own silhouette
  const seed = Math.round(rotation * 100) + variant * 7
  const { main, accent, pebble } = useMemo(() => ({
    main:   rockGeometry(seed,       { detail: 3, rough: 0.34, flatY: -0.16 }),
    accent: rockGeometry(seed + 13,  { detail: 2, rough: 0.4,  flatY: -0.2 }),
    pebble: rockGeometry(seed + 29,  { detail: 1, rough: 0.3,  flatY: -0.25, moss: false }),
  }), [seed])

  const pebbles = useMemo(() => [0, 1, 2].map(i => ({
    a: pr(seed + i, 1) * Math.PI * 2,
    r: 0.48 + pr(seed + i, 2) * 0.22,
    s: 0.08 + pr(seed + i, 3) * 0.07,
  })), [seed])

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <GroundShadow radius={0.72} opacity={0.5} y={0.006 / scale} />

      {/* Main boulder — partly sunk into the soil */}
      <mesh geometry={main} position={[0, 0.1, 0]} scale={[1, 0.78, 0.9]} rotation={[0, 0, 0.06]} castShadow receiveShadow>
        <meshStandardMaterial color={col} vertexColors roughness={0.92} metalness={0.02} flatShading />
      </mesh>

      {/* Leaning accent rock */}
      <mesh geometry={accent} position={[0.36, 0.02, 0.22]} scale={[0.46, 0.4, 0.42]} rotation={[0.3, 0.8, 0.2]} castShadow receiveShadow>
        <meshStandardMaterial color={col2} vertexColors roughness={0.95} flatShading />
      </mesh>

      {/* Loose pebbles scattered around the base */}
      {pebbles.map((p, i) => (
        <mesh
          key={i}
          geometry={pebble}
          position={[Math.cos(p.a) * p.r, p.s * 0.25, Math.sin(p.a) * p.r]}
          scale={[p.s * 2, p.s * 1.3, p.s * 1.7]}
          rotation={[0, p.a, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={col2} vertexColors roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  )
}

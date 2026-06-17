'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ROUND1_LEVEL } from '@/store/store'

// Deterministic pseudo-random — never use Math.random() inside render
function pr(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 31.3) * 43758.5453
  return x - Math.floor(x)
}

// 48 tiny wildflowers: position + color index (0-4)
const TINY_FLOWERS = Array.from({ length: 48 }, (_, i) => ({
  x:     (pr(i, 1) * 2 - 1) * 13.2,
  z:     (pr(i, 2) * 2 - 1) * 13.2,
  rot:   pr(i, 3) * Math.PI * 2,
  size:  0.055 + pr(i, 4) * 0.045,
  color: (['#ff6888', '#ffeeaa', '#ffe0f0', '#ff9944', '#cc88ff'] as const)[Math.floor(pr(i, 5) * 5)],
}))

// Ground tile color palette — 4 organic shades
const TILE_COLS = ['#2e6a38', '#316640', '#2a6e38', '#2c663a']

export default function Ground() {
  const { size } = ROUND1_LEVEL
  const full = size * 2 + 2       // 32 units

  const streamMatRef = useRef<THREE.MeshStandardMaterial>(null)

  // Subtle stream shimmer
  useFrame(({ clock }) => {
    if (streamMatRef.current) {
      streamMatRef.current.emissiveIntensity = 0.10 + Math.sin(clock.elapsedTime * 1.4) * 0.06
    }
  })

  return (
    <>
      {/* ── Base grass plane ─────────────────────────────── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[full, full]} />
        <meshStandardMaterial color="#2d6a36" roughness={0.93} />
      </mesh>

      {/* ── Organic 4-tone ground patches (7×7) ──────────── */}
      {Array.from({ length: 7 }, (_, row) =>
        Array.from({ length: 7 }, (_, col) => {
          const cx   = (col - 3) * (full / 7)
          const cz   = (row - 3) * (full / 7)
          const tone = (row * 3 + col * 5) % 4
          return (
            <mesh
              key={`t${row}-${col}`}
              rotation={[-Math.PI / 2, 0, (row + col) * 0.18]}
              position={[cx, -0.015, cz]}
              receiveShadow
            >
              <planeGeometry args={[full / 7 - 0.12, full / 7 - 0.12]} />
              <meshStandardMaterial color={TILE_COLS[tone]} roughness={0.93} />
            </mesh>
          )
        })
      )}

      {/* ── Scattered tiny wildflowers ────────────────────── */}
      {TINY_FLOWERS.map((f, i) => (
        <mesh
          key={`fl${i}`}
          rotation={[-Math.PI / 2, f.rot, 0]}
          position={[f.x, 0.012, f.z]}
        >
          <circleGeometry args={[f.size, 6]} />
          <meshStandardMaterial color={f.color} roughness={0.75} />
        </mesh>
      ))}

      {/* ── Stream — winding water near north wall ────────── */}
      {/* Main water surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, -13.2]}>
        <planeGeometry args={[full, 2.8]} />
        <meshStandardMaterial
          ref={streamMatRef}
          color="#1e5c8a"
          emissive="#3080c0"
          emissiveIntensity={0.12}
          roughness={0.06}
          metalness={0.3}
          transparent
          opacity={0.82}
          side={2}
          depthWrite={false}
        />
      </mesh>

      {/* Stream banks — dark soil strips */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -11.85]}>
        <planeGeometry args={[full, 0.5]} />
        <meshStandardMaterial color="#4a3820" roughness={0.96} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -14.55]}>
        <planeGeometry args={[full, 0.5]} />
        <meshStandardMaterial color="#4a3820" roughness={0.96} />
      </mesh>

      {/* Mossy bank patches along stream edge */}
      {[-11, -7, -2, 4, 9, 13].map((x, i) => (
        <mesh
          key={`moss${i}`}
          rotation={[-Math.PI / 2, i * 0.7, 0]}
          position={[x, 0.008, -11.7 + (i % 2) * 0.3]}
        >
          <circleGeometry args={[0.45 + (i % 3) * 0.12, 7]} />
          <meshStandardMaterial color="#3a7a30" roughness={0.9} />
        </mesh>
      ))}
    </>
  )
}
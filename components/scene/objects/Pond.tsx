'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  position: [number, number, number]
  scale?: number
}

// Pre-computed bank rocks — avoid allocating in render
const BANK_ROCKS = Array.from({ length: 9 }, (_, i) => ({
  angle: (i / 9) * Math.PI * 2 + 0.25,
  r:     1.65 + (i % 3) * 0.14,
  s:     0.14 + (i % 4) * 0.035,
}))

const LILY_PADS = [
  { x:  0.52, z:  0.28, rot: 0.3 },
  { x: -0.55, z:  0.12, rot: 1.9 },
  { x:  0.15, z: -0.65, rot: 3.5 },
]

export default function Pond({ position, scale = 1 }: Props) {
  const waterRef = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    if (waterRef.current) {
      waterRef.current.emissiveIntensity = 0.14 + Math.sin(clock.elapsedTime * 1.6) * 0.08
    }
  })

  const r = 1.45 * scale

  return (
    <group position={position}>
      {/* Muddy bank ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[r, r + 0.7 * scale, 20]} />
        <meshStandardMaterial color="#5a4828" roughness={0.97} />
      </mesh>

      {/* Water surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[r, 20]} />
        <meshStandardMaterial
          ref={waterRef}
          color="#1a5e8e"
          emissive="#3088c0"
          emissiveIntensity={0.15}
          roughness={0.06}
          metalness={0.28}
          transparent
          opacity={0.88}
          side={2}
          depthWrite={false}
        />
      </mesh>

      {/* Lily pads */}
      {LILY_PADS.map((lp, i) => (
        <group key={i} position={[lp.x * scale, 0.065, lp.z * scale]}>
          <mesh rotation={[-Math.PI / 2, lp.rot, 0]}>
            <circleGeometry args={[0.21 * scale, 9]} />
            <meshStandardMaterial color="#2a7a30" roughness={0.8} />
          </mesh>
          {/* Tiny white flower on pad */}
          <mesh position={[0, 0.04, 0]}>
            <sphereGeometry args={[0.055 * scale, 5, 4]} />
            <meshStandardMaterial color="#fff8e8" roughness={0.7} emissive="#ffffc0" emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}

      {/* Bank rocks */}
      {BANK_ROCKS.map((br, i) => (
        <mesh key={i} position={[Math.cos(br.angle) * br.r * scale, 0.11 * scale, Math.sin(br.angle) * br.r * scale]}>
          <dodecahedronGeometry args={[br.s * scale, 0]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#6a6258' : '#5a5248'} roughness={0.96} />
        </mesh>
      ))}

      {/* Reeds — thin cylinders poking up at the bank */}
      {[0.8, 1.6, 2.9, 4.2, 5.0].map((angle, i) => (
        <mesh key={`reed${i}`} position={[Math.cos(angle) * (r + 0.35) * scale, 0.32 * scale, Math.sin(angle) * (r + 0.35) * scale]}>
          <cylinderGeometry args={[0.03 * scale, 0.02 * scale, 0.65 * scale, 5]} />
          <meshStandardMaterial color="#4a7a20" roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}
'use client'
import { useRef } from 'react'
import { Mesh } from 'three'

const COLORS = ['#7a7068', '#8a8070', '#6a6058']
const SECONDARY = ['#5a5048', '#6a6058', '#4a4038']

interface Props {
  position: [number, number, number]
  scale?: number
  rotation?: number
  variant?: number
}

export default function Rock({ position, scale = 1, rotation = 0, variant = 0 }: Props) {
  const meshRef = useRef<Mesh>(null)
  const col = COLORS[variant % COLORS.length]
  const col2 = SECONDARY[variant % SECONDARY.length]

  return (
    <group position={position} rotation={[rotation * 0.3, rotation, rotation * 0.2]}>
      {/* Main rock body */}
      <mesh ref={meshRef} scale={[scale, scale * 0.75, scale]}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={col} roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Small accent rock */}
      <mesh position={[scale * 0.3, -scale * 0.15, scale * 0.2]}
            scale={[scale * 0.45, scale * 0.35, scale * 0.4]}
            rotation={[0.5, 0.8, 0.3]}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={col2} roughness={0.98} />
      </mesh>
    </group>
  )
}
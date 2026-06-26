'use client'

const TRUNK_COLORS  = ['#6b4226', '#7a4e2d', '#5a3520']
const CANOPY_COLORS = ['#1a6e1a', '#1d7a1d', '#156015']

interface Props {
  position: [number, number, number]
  scale?: number
  rotation?: number
  variant?: number
}

export default function Tree({ position, scale = 1, rotation = 0, variant = 0 }: Props) {
  const trunkCol  = TRUNK_COLORS[variant % TRUNK_COLORS.length]
  const canopyCol = CANOPY_COLORS[variant % CANOPY_COLORS.length]
  const h = scale * 2.2

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Trunk */}
      <mesh position={[0, h * 0.28, 0]}>
        <cylinderGeometry args={[0.12 * scale, 0.18 * scale, h * 0.55, 7]} />
        <meshStandardMaterial color={trunkCol} roughness={0.95} />
      </mesh>
      {/* Lower canopy */}
      <mesh position={[0, h * 0.68, 0]}>
        <sphereGeometry args={[0.55 * scale, 9, 9]} />
        <meshStandardMaterial color={canopyCol} roughness={0.88} />
      </mesh>
      {/* Mid canopy */}
      <mesh position={[0, h * 0.83, 0]}>
        <sphereGeometry args={[0.42 * scale, 8, 8]} />
        <meshStandardMaterial color={canopyCol} roughness={0.85} />
      </mesh>
      {/* Top cluster */}
      <mesh position={[0, h * 0.97, 0]}>
        <sphereGeometry args={[0.25 * scale, 7, 7]} />
        <meshStandardMaterial color="#2a8a2a" roughness={0.8} />
      </mesh>
    </group>
  )
}
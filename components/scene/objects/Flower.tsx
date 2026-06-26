'use client'

const PETAL_COLORS = ['#ff88aa', '#ff6699', '#cc44ff', '#ff8833', '#ffcc00', '#ff4488']
const CENTER_COLORS = ['#ffee44', '#ffdd22', '#ff9900']

interface Props {
  position: [number, number, number]
  scale?: number
  rotation?: number
  variant?: number
}

export default function Flower({ position, scale = 1, rotation = 0, variant = 0 }: Props) {
  const petalCol = PETAL_COLORS[variant % PETAL_COLORS.length]
  const centerCol = CENTER_COLORS[variant % CENTER_COLORS.length]
  const stemH = 0.5 * scale
  const topY = stemH + 0.05 * scale

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Stem */}
      <mesh position={[0, stemH * 0.5, 0]}>
        <cylinderGeometry args={[0.03 * scale, 0.04 * scale, stemH, 5]} />
        <meshStandardMaterial color="#338833" roughness={0.8} />
      </mesh>
      {/* Small leaf on stem */}
      <mesh position={[0.1 * scale, stemH * 0.4, 0]} rotation={[0, 0, -0.6]}>
        <ellipseCurve />
        <sphereGeometry args={[0.08 * scale, 6, 4]} />
        <meshStandardMaterial color="#338833" roughness={0.8} />
      </mesh>
      {/* Petals */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 6) * Math.PI * 2) * 0.14 * scale,
            topY,
            Math.sin((i / 6) * Math.PI * 2) * 0.14 * scale,
          ]}
        >
          <sphereGeometry args={[0.08 * scale, 6, 5]} />
          <meshStandardMaterial color={petalCol} roughness={0.7} />
        </mesh>
      ))}
      {/* Center disc */}
      <mesh position={[0, topY + 0.01 * scale, 0]}>
        <cylinderGeometry args={[0.07 * scale, 0.07 * scale, 0.04 * scale, 8]} />
        <meshStandardMaterial color={centerCol} roughness={0.6} />
      </mesh>
    </group>
  )
}
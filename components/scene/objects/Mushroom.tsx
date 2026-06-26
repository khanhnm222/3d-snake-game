'use client'

const CAP_COLORS   = ['#cc2200', '#dd4400', '#991100']
const STEM_COLORS  = ['#f5f0e8', '#e8e0d0', '#d8d0c0']

interface Props {
  position: [number, number, number]
  scale?: number
  rotation?: number
  variant?: number
}

export default function Mushroom({ position, scale = 1, rotation = 0, variant = 0 }: Props) {
  const capCol  = CAP_COLORS[variant % CAP_COLORS.length]
  const stemCol = STEM_COLORS[variant % STEM_COLORS.length]

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Stem */}
      <mesh position={[0, 0.2 * scale, 0]}>
        <cylinderGeometry args={[0.1 * scale, 0.13 * scale, 0.4 * scale, 8]} />
        <meshStandardMaterial color={stemCol} roughness={0.7} />
      </mesh>
      {/* Cap — hemisphere */}
      <mesh position={[0, 0.42 * scale, 0]}>
        <sphereGeometry args={[0.32 * scale, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={capCol} roughness={0.6} />
      </mesh>
      {/* White spots on cap */}
      {[0, 1, 2].map(i => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 3) * Math.PI * 2) * 0.16 * scale,
            0.52 * scale,
            Math.sin((i / 3) * Math.PI * 2) * 0.16 * scale,
          ]}
        >
          <sphereGeometry args={[0.05 * scale, 5, 5]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}
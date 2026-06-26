'use client'

const LEAF_COLORS = ['#2d8a2d', '#3a9a3a', '#256025']
const STEM_COLORS = ['#4a7c3f', '#5a8c4f', '#3a6c2f']

interface Props {
  position: [number, number, number]
  scale?: number
  rotation?: number
  variant?: number
}

export default function Plant({ position, scale = 1, rotation = 0, variant = 0 }: Props) {
  const leafCol = LEAF_COLORS[variant % LEAF_COLORS.length]
  const stemCol = STEM_COLORS[variant % STEM_COLORS.length]
  const h = scale * 0.8

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Stem */}
      <mesh position={[0, h * 0.4, 0]}>
        <cylinderGeometry args={[0.05 * scale, 0.07 * scale, h * 0.8, 6]} />
        <meshStandardMaterial color={stemCol} roughness={0.8} />
      </mesh>
      {/* Main canopy */}
      <mesh position={[0, h * 0.85, 0]}>
        <sphereGeometry args={[0.28 * scale, 8, 8]} />
        <meshStandardMaterial color={leafCol} roughness={0.9} />
      </mesh>
      {/* Side leaf clusters */}
      {[0, 1, 2].map(i => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 3) * Math.PI * 2) * 0.18 * scale,
            h * 0.7,
            Math.sin((i / 3) * Math.PI * 2) * 0.18 * scale,
          ]}
        >
          <sphereGeometry args={[0.16 * scale, 7, 7]} />
          <meshStandardMaterial color={leafCol} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}
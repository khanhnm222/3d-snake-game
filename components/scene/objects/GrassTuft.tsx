'use client'

const COLORS = ['#4a9a3a', '#3a8a2a', '#5aaa4a']

interface Props {
  position: [number, number, number]
  scale?: number
  rotation?: number
  variant?: number
}

export default function GrassTuft({ position, scale = 1, rotation = 0, variant = 0 }: Props) {
  const col = COLORS[variant % COLORS.length]
  const blades = [
    { rx: -0.2, rz:  0.3, ox: -0.05, oz:  0.0 },
    { rx:  0.2, rz: -0.3, ox:  0.05, oz:  0.0 },
    { rx:  0.1, rz:  0.1, ox:  0.0,  oz: -0.05 },
    { rx: -0.1, rz: -0.1, ox:  0.0,  oz:  0.05 },
  ]

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {blades.map((b, i) => (
        <mesh
          key={i}
          position={[b.ox * scale, 0.15 * scale, b.oz * scale]}
          rotation={[b.rx, (i / 4) * Math.PI * 2, b.rz]}
        >
          <boxGeometry args={[0.06 * scale, 0.3 * scale, 0.04 * scale]} />
          <meshStandardMaterial color={col} roughness={0.9} side={2} />
        </mesh>
      ))}
    </group>
  )
}
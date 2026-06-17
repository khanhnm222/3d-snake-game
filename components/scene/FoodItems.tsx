'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { useGameStore } from '@/store/store'
import type { FoodType } from '@/types'

const FOOD_COLORS: Record<FoodType, string> = {
  apple:  '#ee2222',
  orange: '#ff8800',
  grape:  '#8822cc',
  berry:  '#cc2266',
  banana: '#ffe000',
}
const FOOD_SHAPES: Record<FoodType, [number, number, number]> = {
  apple:  [0.22, 12, 12],
  orange: [0.22, 12, 12],
  grape:  [0.18, 10, 10],
  berry:  [0.16, 9,  9],
  banana: [0.22, 10, 8],
}

function FoodMesh({ x, z, type }: { x: number; z: number; type: FoodType }) {
  const ref = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = 0.3 + Math.sin(clock.elapsedTime * 2 + x + z) * 0.06
    ref.current.rotation.y = clock.elapsedTime * 0.8
  })

  const [r, ws, hs] = FOOD_SHAPES[type]

  return (
    <group ref={ref} position={[x, 0.3, z]}>
      <mesh castShadow>
        <sphereGeometry args={[r, ws, hs]} />
        <meshStandardMaterial
          color={FOOD_COLORS[type]}
          roughness={0.3}
          metalness={0.1}
          emissive={FOOD_COLORS[type]}
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Soft glow ring on ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
        <ringGeometry args={[0.2, 0.38, 16]} />
        <meshBasicMaterial color={FOOD_COLORS[type]} transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

export default function FoodItems() {
  const food = useGameStore(s => s.food)
  return (
    <>
      {food.map(f => (
        <FoodMesh key={f.id} x={f.position.x} z={f.position.z} type={f.type} />
      ))}
    </>
  )
}
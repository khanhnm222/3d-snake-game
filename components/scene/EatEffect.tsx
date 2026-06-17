'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/store'
import type { EatEvent } from '@/store/store'
import type { FoodType } from '@/types'

const FOOD_COLORS: Record<FoodType, string> = {
  apple:  '#ee2222',
  orange: '#ff8800',
  grape:  '#8822cc',
  berry:  '#cc2266',
  banana: '#ffe000',
}

const PARTICLE_COUNT = 10
const DURATION = 0.65

function EatBurst({ event }: { event: EatEvent }) {
  const dismiss = useGameStore(s => s.dismissEatEvent)
  const groupRef = useRef<THREE.Group>(null)
  const startTime = useRef<number | null>(null)
  const dismissed = useRef(false)

  // Each particle: random horizontal angle + slight upward spread
  const angles = useMemo(() => {
    // Use event.id as seed to ensure deterministic randomness per event
    const seed = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const seededRandom = (index: number) => {
      const x = Math.sin(seed + index) * 10000
      return x - Math.floor(x)
    }
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      azimuth: (i / PARTICLE_COUNT) * Math.PI * 2 + (seededRandom(i) - 0.5) * 0.4,
      lift: 0.3 + seededRandom(i + PARTICLE_COUNT) * 0.7,
      speed: 1.2 + seededRandom(i + PARTICLE_COUNT * 2) * 0.8,
    }))
  }, [event.id])

  const color = FOOD_COLORS[event.type]

  useFrame(({ clock }) => {
    if (!groupRef.current || dismissed.current) return

    if (startTime.current === null) {
      startTime.current = clock.elapsedTime
    }

    const t = clock.elapsedTime - startTime.current
    const progress = Math.min(t / DURATION, 1)
    const eased = 1 - Math.pow(1 - progress, 2) // ease-out

    groupRef.current.children.forEach((child, i) => {
      const { azimuth, lift, speed } = angles[i]
      const mesh = child as THREE.Mesh
      const r = eased * speed
      mesh.position.set(
        Math.cos(azimuth) * r,
        eased * lift,
        Math.sin(azimuth) * r,
      )
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.opacity = 1 - progress
      mesh.scale.setScalar(1 - progress * 0.5)
    })

    if (progress >= 1 && !dismissed.current) {
      dismissed.current = true
      dismiss(event.id)
    }
  })

  return (
    <group ref={groupRef} position={[event.x, 0.35, event.z]}>
      {angles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.09, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={1} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

// Score pop-up text (uses a flat ring expanding outward)
function EatRing({ event }: { event: EatEvent }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const startTime = useRef<number | null>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    if (startTime.current === null) startTime.current = clock.elapsedTime
    const t = clock.elapsedTime - startTime.current
    const progress = Math.min(t / DURATION, 1)
    meshRef.current.scale.setScalar(1 + progress * 3)
    const mat = meshRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = (1 - progress) * 0.6
  })

  return (
    <mesh
      ref={meshRef}
      position={[event.x, 0.02, event.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[0.18, 0.32, 20]} />
      <meshBasicMaterial
        color={FOOD_COLORS[event.type]}
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </mesh>
  )
}

export default function EatEffect() {
  const eatEvents = useGameStore(s => s.eatEvents)
  return (
    <>
      {eatEvents.map(ev => (
        <group key={ev.id}>
          <EatBurst event={ev} />
          <EatRing event={ev} />
        </group>
      ))}
    </>
  )
}
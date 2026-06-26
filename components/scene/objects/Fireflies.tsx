'use client'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Deterministic pseudo-random
function pr(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 31.3) * 43758.5453
  return x - Math.floor(x)
}

const COUNT = 18

// All firefly data computed once at module level — never inside render
const FLIES = Array.from({ length: COUNT }, (_, i) => ({
  x:      (pr(i, 1) * 2 - 1) * 11.5,
  baseY:  0.4 + pr(i, 2) * 1.9,
  z:      (pr(i, 3) * 2 - 1) * 11.5,
  phase:  pr(i, 4) * Math.PI * 2,
  speed:  0.22 + pr(i, 5) * 0.32,
  radius: 0.25 + pr(i, 6) * 0.65,
  blink:  1.4 + pr(i, 7) * 2.2,
}))

// Pre-allocate to avoid creating objects in useFrame
const _pos = new THREE.Vector3()

export default function Fireflies() {
  const refs = useRef<(THREE.Mesh | null)[]>([])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    FLIES.forEach((f, i) => {
      const m = refs.current[i]
      if (!m) return
      const ft = t * f.speed + f.phase
      _pos.set(
        f.x + Math.sin(ft * 0.7) * f.radius,
        f.baseY + Math.sin(ft * 1.3) * 0.28,
        f.z + Math.cos(ft * 0.6) * f.radius,
      )
      m.position.copy(_pos)
      ;(m.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.45 + Math.abs(Math.sin(t * f.blink + f.phase)) * 0.75
    })
  })

  return (
    <>
      {FLIES.map((f, i) => (
        <mesh
          key={i}
          ref={el => { refs.current[i] = el }}
          position={[f.x, f.baseY, f.z]}
        >
          <sphereGeometry args={[0.038, 4, 4]} />
          <meshStandardMaterial
            color="#ccffaa"
            emissive="#88ff44"
            emissiveIntensity={0.8}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  )
}
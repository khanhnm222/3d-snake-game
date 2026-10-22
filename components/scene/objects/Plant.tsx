'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { leafGeometry, stemGeometry, pr } from './procedural'
import GroundShadow from './GroundShadow'

const LEAF_COLORS = ['#3a8f32', '#4a9e3a', '#2f7428']
const STEM_COLORS = ['#4f7a36', '#5c8a40', '#436a2e']

interface Props {
  position: [number, number, number]
  scale?: number
  rotation?: number
  variant?: number
}

// Leafy bush: an outer rosette of broad drooping leaves, an inner ring of
// younger upright leaves and a few stalks topped with fresh sprouts.
export default function Plant({ position, scale = 1, rotation = 0, variant = 0 }: Props) {
  const leafCol = LEAF_COLORS[variant % LEAF_COLORS.length]
  const stemCol = STEM_COLORS[variant % STEM_COLORS.length]
  const seed    = Math.round(rotation * 100) + variant * 5
  const swayRef = useRef<THREE.Group>(null)

  const { outer, inner, stalks, bigLeaf, youngLeaf, sprout } = useMemo(() => {
    const bigLeaf   = leafGeometry({ length: 0.62, width: 0.3, curl: -0.55, cup: 0.18, shape: 0.8, segs: 9 })
    const youngLeaf = leafGeometry({ length: 0.45, width: 0.2, curl: -0.2, cup: 0.25, shape: 1.0, segs: 7 })
    const sprout    = leafGeometry({ length: 0.2, width: 0.12, curl: -0.15, cup: 0.3, shape: 1.0, segs: 5 })

    const outer = Array.from({ length: 9 }, (_, i) => ({
      yaw:   (i / 9) * Math.PI * 2 + pr(seed + i, 1) * 0.35,
      pitch: -0.75 - pr(seed + i, 2) * 0.35,     // leaning out
      y:     0.06 + pr(seed + i, 3) * 0.06,
      s:     0.85 + pr(seed + i, 4) * 0.3,
      shade: 0.85 + pr(seed + i, 5) * 0.25,
    }))
    const inner = Array.from({ length: 6 }, (_, i) => ({
      yaw:   (i / 6) * Math.PI * 2 + 0.5 + pr(seed + i, 6) * 0.4,
      pitch: -1.15 - pr(seed + i, 7) * 0.25,     // more upright
      y:     0.12 + pr(seed + i, 8) * 0.08,
      s:     0.9 + pr(seed + i, 9) * 0.25,
      shade: 1.05 + pr(seed + i, 10) * 0.15,
    }))
    const stalks = [0, 1, 2].map(i => {
      const a = (i / 3) * Math.PI * 2 + pr(seed + i, 11)
      const bend = 0.08 + pr(seed + i, 12) * 0.08
      return stemGeometry(0.55 + pr(seed + i, 13) * 0.2, 0.018, Math.cos(a) * bend, Math.sin(a) * bend, 6, 5)
    })
    return { outer, inner, stalks, bigLeaf, youngLeaf, sprout }
  }, [seed])

  useFrame(({ clock }) => {
    const g = swayRef.current
    if (!g) return
    const t = clock.elapsedTime * 1.1 + seed
    g.rotation.z = Math.sin(t) * 0.035
    g.rotation.x = Math.sin(t * 0.8 + 2) * 0.025
  })

  const tint = (k: number) => new THREE.Color(leafCol).multiplyScalar(k)

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <GroundShadow radius={0.6} opacity={0.42} y={0.006 / scale} />

      <group ref={swayRef}>
        {outer.map((l, i) => (
          <group key={`o${i}`} position={[0, l.y, 0]} rotation={[0, l.yaw, 0]}>
            <mesh geometry={bigLeaf} rotation={[l.pitch, 0, 0]} scale={l.s} castShadow receiveShadow>
              <meshStandardMaterial color={tint(l.shade)} vertexColors roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}

        {inner.map((l, i) => (
          <group key={`i${i}`} position={[0, l.y, 0]} rotation={[0, l.yaw, 0]}>
            <mesh geometry={youngLeaf} rotation={[l.pitch, 0, 0]} scale={l.s} castShadow receiveShadow>
              <meshStandardMaterial color={tint(l.shade)} vertexColors roughness={0.65} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}

        {stalks.map((st, i) => (
          <group key={`s${i}`}>
            <mesh geometry={st.geometry} castShadow>
              <meshStandardMaterial color={stemCol} roughness={0.8} />
            </mesh>
            {/* Pair of fresh leaves at the tip */}
            {[0, Math.PI].map((yaw, j) => (
              <group key={j} position={[st.top.x, st.top.y, st.top.z]} rotation={[0, yaw + i, 0]}>
                <mesh geometry={sprout} rotation={[-0.6, 0, 0]} castShadow>
                  <meshStandardMaterial color={tint(1.25)} vertexColors roughness={0.6} side={THREE.DoubleSide} />
                </mesh>
              </group>
            ))}
          </group>
        ))}
      </group>
    </group>
  )
}

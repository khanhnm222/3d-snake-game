'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { leafGeometry, stemGeometry, pr } from './procedural'
import GroundShadow from './GroundShadow'

const PETAL_COLORS  = ['#ff88aa', '#ff6699', '#cc44ff', '#ff8833', '#ffcc00', '#ff4488']
const CENTER_COLORS = ['#ffcc33', '#e8a800', '#c07010']
const PETAL_COUNT   = 10

interface Props {
  position: [number, number, number]
  scale?: number
  rotation?: number
  variant?: number
}

// Daisy-like bloom on a curved stem: cupped petals in two layers, a domed
// seed head ringed with stamens, green sepals and two leaves on the stem.
export default function Flower({ position, scale = 1, rotation = 0, variant = 0 }: Props) {
  const petalCol  = PETAL_COLORS[variant % PETAL_COLORS.length]
  const centerCol = CENTER_COLORS[variant % CENTER_COLORS.length]
  const seed      = Math.round(rotation * 100) + variant * 9
  const headRef   = useRef<THREE.Group>(null)

  const { stem, petal, innerPetal, leaf, sepal, petals, stamens } = useMemo(() => {
    const stem  = stemGeometry(0.52, 0.014, 0.06, 0.03, 10, 6)
    const petal = leafGeometry({ length: 0.16, width: 0.075, curl: 0.25, cup: 0.25, shape: 0.6, segs: 6, tipWidth: 0.35 })
    const innerPetal = leafGeometry({ length: 0.11, width: 0.06, curl: 0.45, cup: 0.3, shape: 0.6, segs: 5, tipWidth: 0.3 })
    const leaf  = leafGeometry({ length: 0.2, width: 0.08, curl: -0.3, cup: 0.2, shape: 1.1, segs: 7 })
    const sepal = leafGeometry({ length: 0.06, width: 0.04, curl: -0.2, cup: 0.1, shape: 1, segs: 3 })
    const petals = Array.from({ length: PETAL_COUNT }, (_, i) => ({
      yaw: (i / PETAL_COUNT) * Math.PI * 2 + pr(seed + i, 1) * 0.15,
      pitch: -0.12 - pr(seed + i, 2) * 0.18,
      shade: 0.9 + pr(seed + i, 3) * 0.2,
    }))
    const stamens = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2)
    return { stem, petal, innerPetal, leaf, sepal, petals, stamens }
  }, [seed])

  useFrame(({ clock }) => {
    const g = headRef.current
    if (!g) return
    const t = clock.elapsedTime * 1.3 + seed
    g.rotation.z = Math.sin(t) * 0.05
    g.rotation.x = Math.sin(t * 0.7 + 1) * 0.04
  })

  const top = stem.top
  const petalMat = (k: number) => new THREE.Color(petalCol).multiplyScalar(k)

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <GroundShadow radius={0.2} opacity={0.35} y={0.006 / scale} />

      <group ref={headRef}>
        {/* Stem */}
        <mesh geometry={stem.geometry} castShadow>
          <meshStandardMaterial color="#3f8a34" roughness={0.75} />
        </mesh>

        {/* Stem leaves */}
        {[{ y: 0.14, yaw: 0.4 }, { y: 0.26, yaw: 3.3 }].map((l, i) => (
          <group key={`l${i}`} position={[0.01, l.y, 0]} rotation={[0, l.yaw, 0]}>
            <mesh geometry={leaf} rotation={[-0.7, 0, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#3a8a30" vertexColors roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}

        {/* Bloom — tilted slightly toward the viewer / sun */}
        <group position={[top.x, top.y, top.z]} rotation={[0.25, 0, 0.1]}>
          {/* Sepals */}
          {[0, 1, 2, 3, 4].map(i => (
            <group key={`sp${i}`} rotation={[0, (i / 5) * Math.PI * 2, 0]}>
              <mesh geometry={sepal} position={[0, -0.012, 0]} rotation={[0.5, 0, 0]}>
                <meshStandardMaterial color="#2f7a28" vertexColors roughness={0.7} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}

          {/* Outer petals */}
          {petals.map((p, i) => (
            <group key={`p${i}`} rotation={[0, p.yaw, 0]}>
              <mesh geometry={petal} position={[0, 0, 0.02]} rotation={[p.pitch, 0, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={petalMat(p.shade)} vertexColors roughness={0.55} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}

          {/* Inner petal layer, offset between the outer ones */}
          {petals.map((p, i) => (
            <group key={`ip${i}`} rotation={[0, p.yaw + Math.PI / PETAL_COUNT, 0]}>
              <mesh geometry={innerPetal} position={[0, 0.008, 0.015]} rotation={[-0.35, 0, 0]} castShadow>
                <meshStandardMaterial color={petalMat(p.shade * 1.1)} vertexColors roughness={0.55} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}

          {/* Domed seed head */}
          <mesh position={[0, 0.012, 0]} scale={[1, 0.55, 1]} castShadow>
            <sphereGeometry args={[0.045, 14, 10]} />
            <meshStandardMaterial color={centerCol} roughness={0.9} />
          </mesh>

          {/* Stamen ring */}
          {stamens.map((a, i) => (
            <mesh key={`st${i}`} position={[Math.cos(a) * 0.036, 0.024, Math.sin(a) * 0.036]}>
              <sphereGeometry args={[0.008, 5, 4]} />
              <meshStandardMaterial color="#8a4a08" roughness={0.8} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

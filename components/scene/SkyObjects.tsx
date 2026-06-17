'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ── Helpers ───────────────────────────────────────────────────────────

function makeStarGeo(count: number, rMin: number, rMax: number) {
  const g   = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    // Uniform distribution on the upper hemisphere
    const theta = Math.random() * Math.PI * 2
    const phi   = Math.acos(Math.random())        // 0 = zenith, π/2 = horizon
    const r     = rMin + Math.random() * (rMax - rMin)
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = r * Math.cos(phi) + 3       // keep above horizon line
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  return g
}

// ── Stars — three size layers for depth ──────────────────────────────

function StarField() {
  // 200 bright / 900 medium / 2 400 tiny = 3 500 total
  const brightGeo = useMemo(() => makeStarGeo(200,  40, 48), [])
  const midGeo    = useMemo(() => makeStarGeo(900,  41, 49), [])
  const tinyGeo   = useMemo(() => makeStarGeo(2400, 42, 50), [])

  const brightMat = useRef<THREE.PointsMaterial>(null)
  const midMat    = useRef<THREE.PointsMaterial>(null)
  const tinyMat   = useRef<THREE.PointsMaterial>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // Each layer twinkles independently at different frequencies
    if (brightMat.current) brightMat.current.opacity = 0.82 + Math.sin(t * 2.1)        * 0.18
    if (midMat.current)    midMat.current.opacity    = 0.60 + Math.sin(t * 1.5 + 1.0)  * 0.14
    if (tinyMat.current)   tinyMat.current.opacity   = 0.45 + Math.sin(t * 0.9 + 2.2)  * 0.10
  })

  return (
    <>
      {/* Bright prominent stars — warm white with a hint of gold */}
      <points geometry={brightGeo}>
        <pointsMaterial
          ref={brightMat}
          size={0.30}
          color="#fff6e0"
          sizeAttenuation
          transparent
          opacity={0.90}
          depthWrite={false}
        />
      </points>

      {/* Medium stars — neutral cool white */}
      <points geometry={midGeo}>
        <pointsMaterial
          ref={midMat}
          size={0.13}
          color="#d8e4ff"
          sizeAttenuation
          transparent
          opacity={0.70}
          depthWrite={false}
        />
      </points>

      {/* Tiny dust — faint cool blue-white layer */}
      <points geometry={tinyGeo}>
        <pointsMaterial
          ref={tinyMat}
          size={0.055}
          color="#a8b8e8"
          sizeAttenuation
          transparent
          opacity={0.50}
          depthWrite={false}
        />
      </points>
    </>
  )
}

// ── Moon ─────────────────────────────────────────────────────────────
// Uses meshBasicMaterial so it is always fully bright
// regardless of how dark the scene lighting is.

function Moon() {
  const halo1 = useRef<THREE.Mesh>(null)
  const halo2 = useRef<THREE.Mesh>(null)
  const halo3 = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (halo1.current) {
      ;(halo1.current.material as THREE.MeshBasicMaterial).opacity =
        0.28 + Math.sin(t * 0.65) * 0.07
    }
    if (halo2.current) {
      ;(halo2.current.material as THREE.MeshBasicMaterial).opacity =
        0.13 + Math.sin(t * 0.42 + 1.0) * 0.04
    }
    if (halo3.current) {
      ;(halo3.current.material as THREE.MeshBasicMaterial).opacity =
        0.05 + Math.sin(t * 0.28 + 2.5) * 0.02
    }
  })

  return (
    <group position={[-18, 26, -22]}>
      {/* Core disc — always-bright, never dimmed by scene lighting */}
      <mesh>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial color="#eef2ff" />
      </mesh>

      {/* Subtle surface shading overlay — gives a slight crater impression */}
      <mesh>
        <sphereGeometry args={[1.64, 24, 24]} />
        <meshBasicMaterial
          color="#90a8d8"
          transparent
          opacity={0.18}
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Inner halo — bright blue-white bloom */}
      <mesh ref={halo1}>
        <sphereGeometry args={[3.0, 20, 20]} />
        <meshBasicMaterial
          color="#7090c8"
          transparent
          opacity={0.30}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Mid corona */}
      <mesh ref={halo2}>
        <sphereGeometry args={[5.5, 16, 16]} />
        <meshBasicMaterial
          color="#4060a8"
          transparent
          opacity={0.13}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer soft corona — very wide, very faint */}
      <mesh ref={halo3}>
        <sphereGeometry args={[9.0, 12, 12]} />
        <meshBasicMaterial
          color="#203060"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Point light at moon position — spills a little moonlight onto nearby atmosphere */}
      <pointLight color="#8090d0" intensity={0.5} distance={20} decay={2} />
    </group>
  )
}

// ── Sun (day) ────────────────────────────────────────────────────────

function Sun() {
  const raysRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!raysRef.current) return
    raysRef.current.rotation.z = clock.elapsedTime * 0.08
    ;(raysRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.18 + Math.sin(clock.elapsedTime * 0.5) * 0.06
  })

  return (
    <group position={[18, 28, -22]}>
      <mesh>
        <sphereGeometry args={[2.2, 24, 24]} />
        <meshBasicMaterial color="#fff4a0" />
      </mesh>
      <mesh>
        <sphereGeometry args={[3.2, 16, 16]} />
        <meshBasicMaterial color="#ffe860" transparent opacity={0.18} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh ref={raysRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.5, 0.25, 4, 14]} />
        <meshBasicMaterial color="#ffdd40" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  )
}

function SunShaft() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity =
      0.04 + Math.sin(clock.elapsedTime * 0.4) * 0.02
  })
  return (
    <mesh ref={ref} position={[9, 14, -11]} rotation={[0.4, -0.5, 0.2]}>
      <coneGeometry args={[3, 22, 6, 1, true]} />
      <meshBasicMaterial color="#fff4c0" transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

// ── Public component ─────────────────────────────────────────────────

export default function SkyObjects({ darkMode }: { darkMode: boolean }) {
  return darkMode ? (
    <>
      <StarField />
      <Moon />
    </>
  ) : (
    <>
      <Sun />
      <SunShaft />
    </>
  )
}
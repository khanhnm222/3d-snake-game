'use client'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Obstacle } from '@/types'
import { useGameStore } from '@/store/store'
import { insidePipe } from '@/utils/terrain'
import { rustTexture, rockGeometry, pr } from '../objects/procedural'
import GroundShadow from '../objects/GroundShadow'

const R_OUT   = 0.68   // shell outer radius
const R_IN    = 0.61   // shell inner radius
const R_FL    = 0.8    // flange radius
const AXIS_Y  = 0.5    // pipe centre height — bottom sits slightly buried
const BOLTS   = 12
const FADED   = 0.28   // shell opacity while the snake is inside

// Solid ring (flange / coupling) revolved around Y, later turned onto the pipe axis
function ringLathe(rIn: number, rOut: number, thick: number) {
  const h = thick / 2
  return new THREE.LatheGeometry([
    new THREE.Vector2(rIn, -h), new THREE.Vector2(rOut, -h),
    new THREE.Vector2(rOut, h), new THREE.Vector2(rIn, h), new THREE.Vector2(rIn, -h),
  ], 40)
}

type PipeGeo = {
  shell: THREE.CylinderGeometry; inner: THREE.CylinderGeometry
  flange: THREE.LatheGeometry; coupling: THREE.LatheGeometry; bolt: THREE.CylinderGeometry
  berm: THREE.BufferGeometry
}
const GEO = new Map<number, PipeGeo>()   // keyed by pipe length
function getGeo(length: number): PipeGeo {
  if (!GEO.has(length)) {
    GEO.set(length, {
      shell:    new THREE.CylinderGeometry(R_OUT, R_OUT, length, 40, 1, true),
      inner:    new THREE.CylinderGeometry(R_IN, R_IN, length, 40, 1, true),
      flange:   ringLathe(R_IN, R_FL, 0.16),
      coupling: ringLathe(R_OUT - 0.01, R_OUT + 0.06, 0.18),
      bolt:     new THREE.CylinderGeometry(0.03, 0.03, 0.06, 6),
      berm:     rockGeometry(900, { detail: 2, rough: 0.25, flatY: -0.05, moss: true }),
    })
  }
  return GEO.get(length)!
}

// Weathered steel culvert pipe, half-buried in soil berms. The snake can only
// pass through its ends; the shell fades while the snake is inside so the
// player can still see where they are going.
export default function Pipeline({ ob }: { ob: Obstacle }) {
  const L = ob.length
  const geo = getGeo(L)

  const { shellMat, innerMat, flangeMat } = useMemo(() => {
    const rust = rustTexture()
    const shellMat = new THREE.MeshStandardMaterial({
      userData: { fade: true },
      color: '#6a7c84', map: rust, roughness: 0.55, metalness: 0.55, transparent: true,
    })
    const innerMat = new THREE.MeshStandardMaterial({
      userData: { fade: true },
      color: '#3a3430', map: rust, roughness: 0.9, metalness: 0.2, side: THREE.BackSide, transparent: true,
    })
    const flangeMat = new THREE.MeshStandardMaterial({
      userData: { fade: true },
      color: '#56666c', map: rust, roughness: 0.5, metalness: 0.65, transparent: true,
    })
    return { shellMat, innerMat, flangeMat }
  }, [])

  // Faded materials are reached through the scene graph (tagged via userData)
  const rootRef = useRef<THREE.Group>(null)
  useEffect(() => () => { shellMat.dispose(); innerMat.dispose(); flangeMat.dispose() }, [shellMat, innerMat, flangeMat])

  const bolts = useMemo(() => Array.from({ length: BOLTS }, (_, i) => (i / BOLTS) * Math.PI * 2), [])
  const moss  = useMemo(() => [0, 1, 2].map(i => ({
    u: (pr(i, 61) - 0.5) * (L - 1.2),
    a: (pr(i, 62) - 0.5) * 0.9,
    s: 0.18 + pr(i, 63) * 0.16,
  })), [L])

  // Fade shell when any of the front segments is in / near the tunnel
  useFrame((_, delta) => {
    const { snake } = useGameStore.getState()
    let inside = false
    for (let i = 0; i < Math.min(snake.length, 6); i++) {
      if (insidePipe(snake[i].x, snake[i].z, ob, 0.8)) { inside = true; break }
    }
    const target = inside ? FADED : 1
    const k = 1 - Math.pow(0.002, delta)
    const seen = new Set<THREE.Material>()
    rootRef.current?.traverse(o => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
      if (!m || !m.userData.fade || seen.has(m)) return
      seen.add(m)
      m.opacity = THREE.MathUtils.lerp(m.opacity, target, k)
      m.depthWrite = m.opacity > 0.95
    })
  })

  // Local frame: pipe runs along +X; rotate for z-axis pipes
  return (
    <group ref={rootRef} position={[ob.position.x, 0, ob.position.z]} rotation={[0, ob.axis === 'z' ? Math.PI / 2 : 0, 0]}>
      <GroundShadow radius={L * 0.55} stretch={0.28} opacity={0.5} />

      <group position={[0, AXIS_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
        {/* Shell + dark interior */}
        <mesh geometry={geo.shell} material={shellMat} castShadow receiveShadow />
        <mesh geometry={geo.inner} material={innerMat} receiveShadow />

        {/* End flanges with bolt rings */}
        {[-1, 1].map(end => (
          <group key={end} position={[0, end * (L / 2 - 0.08), 0]}>
            <mesh geometry={geo.flange} material={flangeMat} castShadow receiveShadow />
            {bolts.map((a, i) => (
              <mesh
                key={i}
                geometry={geo.bolt}
                material={flangeMat}
                position={[Math.cos(a) * 0.71, end * 0.09, Math.sin(a) * 0.71]}
                castShadow
              />
            ))}
          </group>
        ))}

        {/* Mid-span coupling where two pipe sections join */}
        <mesh geometry={geo.coupling} material={flangeMat} castShadow receiveShadow />
        {bolts.map((a, i) => (
          <mesh key={`cb${i}`} geometry={geo.bolt} material={flangeMat}
                position={[Math.cos(a) * (R_OUT + 0.06), 0, Math.sin(a) * (R_OUT + 0.06)]}
                rotation={[0, -a, Math.PI / 2]} />
        ))}
      </group>

      {/* Moss clinging to the top of the shell */}
      {moss.map((m, i) => (
        <mesh key={`m${i}`} position={[m.u, AXIS_Y + Math.cos(m.a) * R_OUT, Math.sin(m.a) * R_OUT]}
              rotation={[m.a, 0, 0]} scale={[m.s * 1.6, 0.05, m.s]} castShadow receiveShadow>
          <sphereGeometry args={[1, 10, 6]} />
          <meshStandardMaterial color="#4a7a30" roughness={0.95} />
        </mesh>
      ))}

      {/* Soil berms along both sides — pipe looks half-buried */}
      {[-1, 1].map(side => (
        <mesh key={`b${side}`} geometry={geo.berm} position={[0, 0.02, side * 0.62]}
              scale={[L * 0.95, 0.32, 0.55]} rotation={[0, side > 0 ? 0 : Math.PI, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#6b5a3a" vertexColors roughness={0.98} />
        </mesh>
      ))}
    </group>
  )
}

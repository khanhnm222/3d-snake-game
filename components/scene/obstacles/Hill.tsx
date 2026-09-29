'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { Obstacle } from '@/types'
import { hillHeight } from '@/utils/terrain'
import { fbm, pr, rockGeometry } from '../objects/procedural'
import GrassTuft from '../objects/GrassTuft'
import Flower from '../objects/Flower'

const RINGS = 18
const SEGS  = 56

const LAWN  = new THREE.Color('#2d6a36')   // matches the ground tiles at the rim
const GREEN = new THREE.Color('#3f8a3a')
const DRY   = new THREE.Color('#7a9a44')   // sun-bleached crest
const SOIL  = new THREE.Color('#5a4a2e')

// Polar grid mesh: rings from the crest out to just past the radius, where the
// rim dips below the ground plane so the mound blends seamlessly into the lawn.
function hillGeometry(ob: Obstacle): THREE.BufferGeometry {
  const R = ob.radius + 0.35
  const verts: number[] = []
  const cols: number[] = []
  const idx: number[] = []
  const c = new THREE.Color()
  const seed = ob.position.x * 13 + ob.position.z * 7

  verts.push(0, ob.height, 0)
  c.copy(DRY); cols.push(c.r, c.g, c.b)
  for (let r = 1; r <= RINGS; r++) {
    const t = r / RINGS
    const rr = Math.pow(t, 0.85) * R
    for (let s = 0; s < SEGS; s++) {
      const a = (s / SEGS) * Math.PI * 2
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr
      const n = fbm(x * 0.9, z * 0.9, 0.3, seed, 3)
      // Height matches the gameplay heightfield (plus tiny lumps); rim sinks below ground
      let y = hillHeight(ob, ob.position.x + x, ob.position.z + z) + n * 0.03 * (1 - t)
      if (rr > ob.radius) y = -0.03
      verts.push(x, y, z)

      const k = y / ob.height
      c.copy(LAWN).lerp(GREEN, THREE.MathUtils.smoothstep(k, 0.02, 0.4))
      c.lerp(DRY, THREE.MathUtils.smoothstep(k + n * 0.3, 0.7, 1.0) * 0.6)
      // Bare soil patches on the steepest flank
      const steep = THREE.MathUtils.smoothstep(Math.abs(k - 0.5), 0.3, 0) * THREE.MathUtils.smoothstep(n, 0.25, 0.5)
      c.lerp(SOIL, steep * 0.5)
      c.multiplyScalar(0.92 + n * 0.12)
      cols.push(c.r, c.g, c.b)
    }
  }
  for (let s = 0; s < SEGS; s++) idx.push(0, 1 + ((s + 1) % SEGS), 1 + s)
  for (let r = 0; r < RINGS - 1; r++) {
    for (let s = 0; s < SEGS; s++) {
      const a = 1 + r * SEGS + s, b = 1 + r * SEGS + ((s + 1) % SEGS)
      const d = a + SEGS, e = b + SEGS
      idx.push(a, b, d, b, e, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

// Small grassy hill the snake can crawl straight over.
export default function Hill({ ob }: { ob: Obstacle }) {
  const { geo, deco, stones, stoneGeo } = useMemo(() => {
    const geo = hillGeometry(ob)
    const seed = ob.position.x * 3 + ob.position.z
    // Tufts + wildflowers scattered on the flanks, sitting on the surface
    const deco = Array.from({ length: 9 }, (_, i) => {
      const a = pr(seed + i, 1) * Math.PI * 2
      const r = (0.35 + pr(seed + i, 2) * 0.55) * ob.radius
      const x = Math.cos(a) * r, z = Math.sin(a) * r
      return {
        p: [x, hillHeight(ob, ob.position.x + x, ob.position.z + z) - 0.02, z] as [number, number, number],
        flower: i % 3 === 0,
        rot: pr(seed + i, 3) * 6,
        variant: i,
      }
    })
    // A couple of half-buried stones near the foot
    const stones = [0, 1].map(i => {
      const a = pr(seed + i, 4) * Math.PI * 2
      const r = ob.radius * 0.85
      const x = Math.cos(a) * r, z = Math.sin(a) * r
      return { p: [x, hillHeight(ob, ob.position.x + x, ob.position.z + z), z] as [number, number, number], s: 0.16 + pr(seed + i, 5) * 0.1, rot: a }
    })
    return { geo, deco, stones, stoneGeo: rockGeometry(800 + seed, { detail: 2, rough: 0.35 }) }
  }, [ob])

  return (
    <group position={[ob.position.x, 0, ob.position.z]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.94} />
      </mesh>
      {deco.map((d, i) => d.flower
        ? <Flower key={i} position={d.p} rotation={d.rot} variant={d.variant} scale={0.8} />
        : <GrassTuft key={i} position={d.p} rotation={d.rot} variant={d.variant} scale={0.9} />,
      )}
      {stones.map((s, i) => (
        <mesh key={`s${i}`} geometry={stoneGeo} position={s.p} rotation={[0, s.rot, 0]} scale={[s.s * 2, s.s * 1.2, s.s * 1.6]} castShadow receiveShadow>
          <meshStandardMaterial color="#7e766a" vertexColors roughness={0.92} flatShading />
        </mesh>
      ))}
    </group>
  )
}

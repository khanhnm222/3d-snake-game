'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { Obstacle } from '@/types'
import { slopeHeight } from '@/utils/terrain'
import { pr, rockGeometry } from '../objects/procedural'
import GrassTuft from '../objects/GrassTuft'

const STONE  = new THREE.Color('#8e877a')
const GROUT  = new THREE.Color('#4e4a42')
const MOSS   = new THREE.Color('#4f7a36')
const GRASS  = new THREE.Color('#2e6a38')
const BLOCK_LEN = 0.5
const WALL_T    = 0.22
const LIP       = 0.14   // how far the side walls rise above the deck

// Paved stone deck following the ramp profile (up ramp → flat top → down ramp)
function deckGeometry(ob: Obstacle): THREE.BufferGeometry {
  const L = ob.length, W = ob.width
  const g = new THREE.PlaneGeometry(L, W, L * 8, W * 6)
  g.rotateX(-Math.PI / 2)
  const pos = g.attributes.position as THREE.BufferAttribute
  const colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i), v = pos.getZ(i)
    const h = slopeHeight(ob, u, v)
    pos.setY(i, h + 0.006)

    // Slab pattern: running bond — every other row offset by half a slab
    const row = Math.floor((v + W / 2) / 0.75)
    const su = (u + L / 2) / 0.6 + (row % 2) * 0.5
    const sv = (v + W / 2) / 0.75
    const fu = su - Math.floor(su), fv = sv - Math.floor(sv)
    const grout = Math.min(fu, 1 - fu) < 0.05 || Math.min(fv, 1 - fv) < 0.05
    const slabShade = 0.82 + pr(Math.floor(su) * 7 + row, 3) * 0.3
    c.copy(STONE).multiplyScalar(slabShade)
    if (grout) c.lerp(GROUT, 0.75)
    // Moss creeping in along the edges; ramp feet blend into the lawn
    const edge = THREE.MathUtils.smoothstep(Math.abs(v), W / 2 - 0.35, W / 2)
    c.lerp(MOSS, edge * 0.55)
    c.lerp(GRASS, 1 - THREE.MathUtils.smoothstep(h, 0, ob.height * 0.25))
    colors.set([c.r, c.g, c.b], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g
}

// Raised ramp crossing with dry-stone retaining walls. The walls make the
// sides solid — the snake has to come up one ramp and go down the other.
export default function Slope({ ob }: { ob: Obstacle }) {
  const { deck, blocks, stones, tufts, stoneGeo } = useMemo(() => {
    const L = ob.length, W = ob.width
    const deck = deckGeometry(ob)

    const blocks: { p: [number, number, number]; s: [number, number, number]; rot: number; shade: number }[] = []
    let k = 0
    for (const side of [-1, 1]) {
      for (let u = -L / 2 + BLOCK_LEN / 2; u < L / 2; u += BLOCK_LEN) {
        // Height taken at the block's higher end so there are no gaps on the ramp
        const inner = u - Math.sign(u) * BLOCK_LEN / 2
        const h = slopeHeight(ob, inner, 0)
        if (h < 0.03) continue
        const hb = h + LIP + 0.05
        blocks.push({
          p: [u, -0.05 + hb / 2, side * (W / 2 + WALL_T / 2)],
          s: [BLOCK_LEN - 0.03, hb, WALL_T + pr(k, 1) * 0.04],
          rot: (pr(k, 2) - 0.5) * 0.06,
          shade: 0.8 + pr(k, 3) * 0.35,
        })
        k++
      }
    }

    // Loose stones and grass around the ramp feet
    const stones = Array.from({ length: 6 }, (_, i) => {
      const end = i % 2 ? 1 : -1
      return {
        p: [end * (L / 2 + 0.1 - pr(i, 4) * 0.6), 0.02, (pr(i, 5) > 0.5 ? 1 : -1) * (W / 2 + 0.3 + pr(i, 6) * 0.3)] as [number, number, number],
        s: 0.12 + pr(i, 7) * 0.12,
        rot: pr(i, 8) * 6,
      }
    })
    const tufts = [
      { p: [-L / 2 + 0.6, 0, W / 2 + 0.45] as [number, number, number], r: 0.3 },
      { p: [L / 2 - 0.4, 0, -W / 2 - 0.45] as [number, number, number], r: 1.9 },
      { p: [0.4, 0, W / 2 + 0.5] as [number, number, number], r: 2.6 },
    ]
    return { deck, blocks, stones, tufts, stoneGeo: rockGeometry(700, { detail: 2, rough: 0.35 }) }
  }, [ob])

  return (
    <group position={[ob.position.x, 0, ob.position.z]} rotation={[0, ob.axis === 'z' ? -Math.PI / 2 : 0, 0]}>
      {/* Deck */}
      <mesh geometry={deck} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.88} />
      </mesh>

      {/* Dry-stone side walls */}
      {blocks.map((b, i) => (
        <mesh key={i} position={b.p} rotation={[0, b.rot, 0]} castShadow receiveShadow>
          <boxGeometry args={b.s} />
          <meshStandardMaterial color={STONE.clone().multiplyScalar(b.shade * 0.9)} roughness={0.95} />
        </mesh>
      ))}

      {/* Scattered stones */}
      {stones.map((s, i) => (
        <mesh key={`s${i}`} geometry={stoneGeo} position={s.p} rotation={[0, s.rot, 0]} scale={[s.s * 2, s.s * 1.3, s.s * 1.6]} castShadow receiveShadow>
          <meshStandardMaterial color="#7a7268" vertexColors roughness={0.92} flatShading />
        </mesh>
      ))}
      {tufts.map((t, i) => <GrassTuft key={`t${i}`} position={t.p} rotation={t.r} variant={i} />)}
    </group>
  )
}

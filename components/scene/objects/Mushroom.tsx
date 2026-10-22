'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { pr } from './procedural'
import GroundShadow from './GroundShadow'

const CAP_COLORS  = ['#c8200c', '#d8480e', '#98140a']
const STEM_COLORS = ['#f3eee2', '#e8e0cc', '#dcd2bc']

interface Props {
  position: [number, number, number]
  scale?: number
  rotation?: number
  variant?: number
}

// Cap profile params (radius R, height H) — shared by geometry and spot placement
const R = 0.34
const H = 0.2

// Fly-agaric style: lathed bulbous stem with skirt, domed cap with an
// in-curled rim, ribbed gills underneath and warts sitting on the cap surface.
function buildParts() {
  // Stem: bulbous base narrowing upward
  const stemPts: THREE.Vector2[] = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    const y = t * 0.44
    const r = 0.075 + 0.055 * Math.pow(1 - t, 2.2) + 0.012 * Math.sin(t * Math.PI)
    stemPts.push(new THREE.Vector2(r, y))
  }
  stemPts.unshift(new THREE.Vector2(0, 0))
  const stem = new THREE.LatheGeometry(stemPts, 20)

  // Skirt (annulus) just under the cap
  const skirtPts = [
    new THREE.Vector2(0.078, 0.37),
    new THREE.Vector2(0.11, 0.35),
    new THREE.Vector2(0.125, 0.315),
    new THREE.Vector2(0.118, 0.3),
  ]
  const skirt = new THREE.LatheGeometry(skirtPts, 20)

  // Cap: dome top → rim curling back under
  const capPts: THREE.Vector2[] = []
  for (let i = 0; i <= 14; i++) {
    const phi = (i / 14) * Math.PI * 0.5
    capPts.push(new THREE.Vector2(R * Math.sin(phi), H * Math.cos(phi)))
  }
  capPts.push(new THREE.Vector2(R * 0.99, -0.025))
  capPts.push(new THREE.Vector2(R * 0.93, -0.035))
  // Lathe expects bottom→top ordering for outward normals
  const cap = new THREE.LatheGeometry(capPts.reverse(), 32)

  // Gills: corrugated disc under the cap
  const gills = new THREE.RingGeometry(0.08, R * 0.93, 96, 3)
  const gp = gills.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), y = gp.getY(i)
    const rr = Math.hypot(x, y)
    const a = Math.atan2(y, x)
    gp.setZ(i, (Math.cos(a * 48) * 0.5 + 0.5) * 0.01 * (rr / R))
  }
  gills.computeVertexNormals()

  return { stem, skirt, cap, gills }
}

let PARTS: ReturnType<typeof buildParts> | null = null
function getParts() {
  if (!PARTS) PARTS = buildParts()
  return PARTS
}

const CAP_TOP = 0.4

interface Wart { p: [number, number, number]; q: THREE.Quaternion; s: number }

function Shroom({ parts, warts, capCol, stemCol, s, offset, tilt }: {
  parts: ReturnType<typeof buildParts>
  warts: Wart[]
  capCol: string
  stemCol: string
  s: number
  offset: [number, number, number]
  tilt: number
}) {
  return (
    <group position={offset} scale={s} rotation={[tilt, 0, tilt * 0.5]}>
      <mesh geometry={parts.stem} castShadow receiveShadow>
        <meshStandardMaterial color={stemCol} roughness={0.8} />
      </mesh>
      <mesh geometry={parts.skirt} castShadow>
        <meshStandardMaterial color={stemCol} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <group position={[0, CAP_TOP, 0]}>
        <mesh geometry={parts.cap} castShadow receiveShadow>
          <meshPhysicalMaterial color={capCol} roughness={0.38} clearcoat={0.5} clearcoatRoughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={parts.gills} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.022, 0]} receiveShadow>
          <meshStandardMaterial color="#efe6d0" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        {warts.map((w, i) => (
          <mesh key={i} position={w.p} quaternion={w.q} scale={[w.s, w.s * 0.45, w.s]} castShadow>
            <sphereGeometry args={[1, 7, 5]} />
            <meshStandardMaterial color="#fbf7ee" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export default function Mushroom({ position, scale = 1, rotation = 0, variant = 0 }: Props) {
  const capCol  = CAP_COLORS[variant % CAP_COLORS.length]
  const stemCol = STEM_COLORS[variant % STEM_COLORS.length]
  const seed    = Math.round(rotation * 100) + variant * 13

  const { parts, warts } = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0)
    // Warts distributed on the cap ellipsoid, oriented along its surface normal
    const warts: Wart[] = Array.from({ length: 11 }, (_, i) => {
      const phi = 0.15 + pr(seed + i, 1) * 1.2           // 0 = top, π/2 = rim
      const theta = (i / 11) * Math.PI * 2 + pr(seed + i, 2) * 0.5
      const p = new THREE.Vector3(R * Math.sin(phi) * Math.cos(theta), H * Math.cos(phi), R * Math.sin(phi) * Math.sin(theta))
      const n = new THREE.Vector3(p.x / (R * R), p.y / (H * H), p.z / (R * R)).normalize()
      return {
        p: p.addScaledVector(n, 0.004).toArray() as [number, number, number],
        q: new THREE.Quaternion().setFromUnitVectors(up, n),
        s: 0.018 + pr(seed + i, 3) * 0.022,
      }
    })
    return { parts: getParts(), warts }
  }, [seed])

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <GroundShadow radius={0.42} opacity={0.45} y={0.006 / scale} />
      <Shroom parts={parts} warts={warts} capCol={capCol} stemCol={stemCol} s={1} offset={[0, 0, 0]} tilt={0.04} />
      {/* Young sibling sprouting beside it */}
      <Shroom parts={parts} warts={warts} capCol={capCol} stemCol={stemCol} s={0.45} offset={[0.26, 0, 0.12]} tilt={-0.18} />
    </group>
  )
}

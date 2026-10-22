'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rockGeometry, bladeGeometry, stemGeometry, fbm, pr } from './procedural'
import GroundShadow from './GroundShadow'

interface Props {
  position: [number, number, number]
  scale?: number
}

const R = 1.45            // base water radius (before `scale`)
const OUTLINE_SEGS = 48

// Note: flat layers are built in XY and laid down with rotation −π/2 about X,
// so outline angle `a` lands at world (cos a, −sin a). Props placed along the
// shore therefore use z = −sin(a).

// Irregular organic shoreline: radius wobble as a function of angle
function shore(a: number, grow = 0): number {
  return R * (1 + fbm(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0.5, 42, 3) * 0.22) + grow
}

function outline(grow: number): THREE.Vector2[] {
  return Array.from({ length: OUTLINE_SEGS }, (_, i) => {
    const a = (i / OUTLINE_SEGS) * Math.PI * 2
    const r = shore(a, grow)
    return new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r)
  })
}

// Pond bed: fan from centre with vertex colours — dark deep water in the
// middle fading to sandy shallows at the edge. Seen through the translucent
// water surface it fakes real depth.
function bedGeometry(): THREE.BufferGeometry {
  const pts = outline(0.05)
  const rings = 5
  const verts: number[] = [0, 0, 0]
  const cols: number[] = []
  const deep = new THREE.Color('#0c2a2e'), shallow = new THREE.Color('#6b5a36')
  cols.push(deep.r, deep.g, deep.b)
  for (let k = 1; k <= rings; k++) {
    const t = k / rings
    const c = deep.clone().lerp(shallow, Math.pow(t, 2.2))
    for (const p of pts) {
      verts.push(p.x * t, p.y * t, 0)
      cols.push(c.r, c.g, c.b)
    }
  }
  const idx: number[] = []
  const n = pts.length
  for (let i = 0; i < n; i++) idx.push(0, 1 + i, 1 + ((i + 1) % n))
  for (let k = 0; k < rings - 1; k++) {
    for (let i = 0; i < n; i++) {
      const a = 1 + k * n + i, b = 1 + k * n + ((i + 1) % n)
      const c = a + n, d = b + n
      idx.push(a, c, b, b, c, d)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

// Built once at module level — pond geometry never changes
let GEO: {
  water: THREE.ShapeGeometry; bed: THREE.BufferGeometry; bank: THREE.ShapeGeometry; wetBank: THREE.ShapeGeometry
  stone: THREE.BufferGeometry[]; reed: THREE.BufferGeometry; cattail: ReturnType<typeof stemGeometry>
  pad: THREE.CircleGeometry; ripple: THREE.RingGeometry
} | null = null

function getGeo() {
  if (!GEO) GEO = buildGeo()
  return GEO
}

function buildGeo() {
  const waterShape = new THREE.Shape(outline(0))
  const wet = new THREE.Shape(outline(0.3))
  wet.holes.push(new THREE.Path(outline(-0.02)))
  const bank = new THREE.Shape(outline(0.78))
  bank.holes.push(new THREE.Path(outline(0.22)))
  return {
    water:   new THREE.ShapeGeometry(waterShape, 4),
    bed:     bedGeometry(),
    bank:    new THREE.ShapeGeometry(bank, 4),
    wetBank: new THREE.ShapeGeometry(wet, 4),
    stone:   [0, 1, 2, 3].map(i => rockGeometry(500 + i, { detail: 2, rough: 0.35, flatY: -0.15, moss: i % 2 === 0 })),
    reed:    bladeGeometry(0.75, 0.05, 0.2, 6),
    cattail: stemGeometry(0.9, 0.012, 0.05, 0.02, 8, 5),
    // Lily pad with its characteristic notch
    pad:     new THREE.CircleGeometry(0.21, 20, 0.25, Math.PI * 2 - 0.5),
    ripple:  new THREE.RingGeometry(0.9, 1, 40),
  }
}

const LILY_PADS = [
  { x:  0.52, z:  0.28, rot: 0.3, s: 1.0,  bloom: true  },
  { x: -0.55, z:  0.12, rot: 1.9, s: 0.85, bloom: false },
  { x:  0.15, z: -0.65, rot: 3.5, s: 1.1,  bloom: true  },
  { x: -0.2,  z:  0.72, rot: 5.1, s: 0.7,  bloom: false },
  { x:  0.78, z: -0.3,  rot: 2.4, s: 0.6,  bloom: false },
]

const RIPPLES = [
  { x:  0.3, z: -0.2, phase: 0.0 },
  { x: -0.4, z:  0.4, phase: 1.3 },
  { x:  0.1, z:  0.5, phase: 2.6 },
]
const RIPPLE_PERIOD = 3.9

export default function Pond({ position, scale = 1 }: Props) {
  const waterRef  = useRef<THREE.MeshPhysicalMaterial>(null)
  const rippleRefs = useRef<(THREE.Mesh | null)[]>([])
  const padRefs    = useRef<(THREE.Group | null)[]>([])

  const { geo, stones, reeds } = useMemo(() => {
    // Shoreline stones following the irregular outline
    const stones = Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2 + pr(i, 1) * 0.25
      const r = shore(a, 0.18 + pr(i, 2) * 0.28)
      return { a, r, s: 0.14 + pr(i, 3) * 0.14, g: i % 4 }
    })
    // Reed clumps in a few spots around the bank, each with cattails
    const reeds = [0.8, 1.6, 2.9, 4.2, 5.0].map((a, k) => ({
      a, r: shore(a, 0.3),
      blades: Array.from({ length: 7 }, (_, i) => ({
        yaw: pr(k * 10 + i, 4) * Math.PI * 2,
        lean: 0.05 + pr(k * 10 + i, 5) * 0.25,
        h: 0.7 + pr(k * 10 + i, 6) * 0.6,
        ox: (pr(k * 10 + i, 7) - 0.5) * 0.14,
        oz: (pr(k * 10 + i, 8) - 0.5) * 0.14,
      })),
      cattails: k % 2 === 0 ? 2 : 1,
    }))
    return { geo: getGeo(), stones, reeds }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (waterRef.current) {
      waterRef.current.emissiveIntensity = 0.08 + Math.sin(t * 1.6) * 0.04
    }
    // Expanding, fading rings
    RIPPLES.forEach((rp, i) => {
      const m = rippleRefs.current[i]
      if (!m) return
      const k = ((t + rp.phase) % RIPPLE_PERIOD) / RIPPLE_PERIOD
      const s = 0.05 + k * 0.45
      m.scale.set(s, s, s)
      ;(m.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.35
    })
    // Lily pads bob gently on the surface
    LILY_PADS.forEach((lp, i) => {
      const g = padRefs.current[i]
      if (!g) return
      g.position.y = 0.062 + Math.sin(t * 1.2 + i * 1.7) * 0.004
      g.rotation.y = lp.rot + Math.sin(t * 0.3 + i) * 0.08
    })
  })

  return (
    <group position={position}>
      {/* ── Flat layers — scaled horizontally only ─────────────────── */}
      <group scale={[scale, 1, scale]}>
        {/* Muddy bank */}
        <mesh geometry={geo.bank} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} receiveShadow>
          <meshStandardMaterial color="#5a4a2e" roughness={0.98} />
        </mesh>
        {/* Dark wet soil at the waterline */}
        <mesh geometry={geo.wetBank} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
          <meshStandardMaterial color="#3a2e1c" roughness={0.55} />
        </mesh>
        {/* Pond bed (deep → shallow gradient) */}
        <mesh geometry={geo.bed} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]} receiveShadow>
          <meshStandardMaterial vertexColors roughness={0.9} />
        </mesh>
        {/* Water surface — glossy, reflective, translucent */}
        <mesh geometry={geo.water} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
          <meshPhysicalMaterial
            ref={waterRef}
            color="#2a6f8e"
            emissive="#1c5a80"
            emissiveIntensity={0.08}
            roughness={0.04}
            metalness={0.1}
            clearcoat={1}
            clearcoatRoughness={0.05}
            transparent
            opacity={0.72}
            depthWrite={false}
          />
        </mesh>
        {/* Ripples */}
        {RIPPLES.map((rp, i) => (
          <mesh
            key={`rp${i}`}
            ref={el => { rippleRefs.current[i] = el }}
            geometry={geo.ripple}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[rp.x, 0.056, rp.z]}
          >
            <meshBasicMaterial color="#d8f0ff" transparent opacity={0.3} depthWrite={false} />
          </mesh>
        ))}
        {/* Lily pads */}
        {LILY_PADS.map((lp, i) => (
          <group key={`lp${i}`} ref={el => { padRefs.current[i] = el }} position={[lp.x, 0.062, lp.z]} rotation={[0, lp.rot, 0]} scale={lp.s}>
            <mesh geometry={geo.pad} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#2f7a2e" roughness={0.45} side={THREE.DoubleSide} />
            </mesh>
            {lp.bloom && (
              <group position={[0.02, 0.01, 0.02]}>
                {Array.from({ length: 8 }, (_, j) => (
                  <mesh
                    key={j}
                    position={[Math.cos((j / 8) * Math.PI * 2) * 0.035, 0.025, Math.sin((j / 8) * Math.PI * 2) * 0.035]}
                    rotation={[0, -(j / 8) * Math.PI * 2, -0.9]}
                    scale={[0.022, 0.05, 0.016]}
                    castShadow
                  >
                    <sphereGeometry args={[1, 8, 6]} />
                    <meshStandardMaterial color={j % 2 ? '#ffe4ee' : '#fff6f8'} roughness={0.6} emissive="#ffd0e0" emissiveIntensity={0.08} />
                  </mesh>
                ))}
                <mesh position={[0, 0.03, 0]}>
                  <sphereGeometry args={[0.02, 8, 6]} />
                  <meshStandardMaterial color="#ffd23a" roughness={0.7} />
                </mesh>
              </group>
            )}
          </group>
        ))}
      </group>

      {/* ── Shoreline stones ───────────────────────────────────────── */}
      {stones.map((st, i) => (
        <mesh
          key={`st${i}`}
          geometry={geo.stone[st.g]}
          position={[Math.cos(st.a) * st.r * scale, st.s * 0.25, -Math.sin(st.a) * st.r * scale]}
          rotation={[0, st.a * 3, 0]}
          scale={[st.s * 2 * scale, st.s * 1.3 * scale, st.s * 1.7 * scale]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={i % 2 === 0 ? '#7a7268' : '#6a6258'} vertexColors roughness={0.9} flatShading />
        </mesh>
      ))}

      {/* ── Reed clumps with cattails ──────────────────────────────── */}
      {reeds.map((rc, k) => (
        <group key={`rc${k}`} position={[Math.cos(rc.a) * rc.r * scale, 0, -Math.sin(rc.a) * rc.r * scale]} scale={scale}>
          <GroundShadow radius={0.22} opacity={0.35} y={0.014 / scale} />
          {rc.blades.map((b, i) => (
            <group key={i} position={[b.ox, 0, b.oz]} rotation={[0, b.yaw, 0]}>
              <mesh geometry={geo.reed} rotation={[b.lean, 0, 0]} scale={[1, b.h, 1]} castShadow>
                <meshStandardMaterial color="#5a8a2a" vertexColors roughness={0.7} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}
          {Array.from({ length: rc.cattails }, (_, j) => (
            <group key={`ct${j}`} position={[j * 0.06 - 0.03, 0, j * 0.04]} rotation={[0, j * 2.1, 0]}>
              <mesh geometry={geo.cattail.geometry} castShadow>
                <meshStandardMaterial color="#6a8a3a" roughness={0.75} />
              </mesh>
              {/* Brown seed head */}
              <mesh position={[geo.cattail.top.x, geo.cattail.top.y - 0.12, geo.cattail.top.z]} castShadow>
                <capsuleGeometry args={[0.028, 0.14, 4, 8]} />
                <meshStandardMaterial color="#5a3a1e" roughness={0.95} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

'use client'
import { ROUND1_LEVEL } from '@/store/store'

const STONE     = '#7e7870'
const STONE2    = '#6e6860'
const STONE_DRK = '#545048'
const IVY       = '#2a6828'
const IVY2      = '#346c30'

// Deterministic pseudo-random
function pr(i: number, salt: number): number {
  const x = Math.sin(i * 127.1 + salt * 31.3) * 43758.5453
  return x - Math.floor(x)
}

interface BattlementsProps {
  cx: number; cz: number
  length: number; wallH: number
  xAligned: boolean; wallT: number
}

function Battlements({ cx, cz, length, wallH, xAligned, wallT }: BattlementsProps) {
  const mW  = 0.85
  const mH  = 0.52
  const gap = 1.85
  const count = Math.max(0, Math.floor((length - 1.5) / gap))
  const start = -(count - 1) / 2 * gap

  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const d  = start + i * gap
        const px = xAligned ? cx + d : cx
        const pz = xAligned ? cz     : cz + d
        return (
          <mesh key={i} position={[px, wallH + mH / 2, pz]} castShadow>
            <boxGeometry args={[xAligned ? mW : wallT, mH, xAligned ? wallT : mW]} />
            <meshStandardMaterial color={STONE} roughness={0.96} />
          </mesh>
        )
      })}
    </>
  )
}

export default function Walls() {
  const { size } = ROUND1_LEVEL
  const halfLen  = size + 0.5   // 15.5  — walls sit just outside play area
  const wallH    = 1.9
  // wallT = 1.0 → inner face at ±(halfLen − 0.5) = ±15.0, exactly at play boundary
  const wallT    = 1.0
  const wallLen  = size * 2 + 2  // 32

  const sides = [
    { x: 0,        z: -halfLen, sx: wallLen, sz: wallT, xAligned: true,  col: STONE  },
    { x: 0,        z:  halfLen, sx: wallLen, sz: wallT, xAligned: true,  col: STONE2 },
    { x: -halfLen, z: 0,        sx: wallT,   sz: wallLen, xAligned: false, col: STONE  },
    { x:  halfLen, z: 0,        sx: wallT,   sz: wallLen, xAligned: false, col: STONE2 },
  ]

  // Ivy patches on inner wall faces — x/z offset keeps them inside the garden
  const ivyPatches = [
    { x: -8,    y: 0.8, z: -(halfLen - 0.55) },
    { x:  4,    y: 1.1, z: -(halfLen - 0.55) },
    { x:  11,   y: 0.6, z: -(halfLen - 0.55) },
    { x: -4,    y: 0.9, z:  (halfLen - 0.55) },
    { x:  8,    y: 0.7, z:  (halfLen - 0.55) },
    { x: -(halfLen - 0.55), y: 0.8, z: -5 },
    { x: -(halfLen - 0.55), y: 0.5, z:  7 },
    { x:  (halfLen - 0.55), y: 1.0, z:  3 },
    { x:  (halfLen - 0.55), y: 0.6, z: -9 },
  ]

  // Corner tower height (taller than wall + merlon)
  const tH = wallH + 0.65
  // Tower box width = wallT so inner face stays at ±15.0 (same as walls)
  const tW = wallT + 0.05

  return (
    <>
      {/* ── Wall bases ───────────────────────────────────── */}
      {sides.map(({ x, z, sx, sz, col }, i) => (
        <mesh key={i} position={[x, wallH / 2, z]} castShadow receiveShadow>
          <boxGeometry args={[sx, wallH, sz]} />
          <meshStandardMaterial color={col} roughness={0.96} metalness={0.02} />
        </mesh>
      ))}

      {/* ── Battlements on top of each wall ──────────────── */}
      {sides.map(({ x, z, sx, sz, xAligned }, i) => (
        <Battlements
          key={`b${i}`}
          cx={x} cz={z}
          length={xAligned ? sx : sz}
          wallH={wallH}
          xAligned={xAligned}
          wallT={wallT}
        />
      ))}

      {/* ── Corner towers — box posts, inner face at ±15.0 ─ */}
      {([[-1, -1], [1, -1], [1, 1], [-1, 1]] as [number, number][]).map(([sx, sz], i) => {
        const tx = sx * halfLen
        const tz = sz * halfLen
        return (
          <group key={`tower${i}`}>
            {/* Tower body */}
            <mesh position={[tx, tH / 2, tz]} castShadow>
              <boxGeometry args={[tW, tH, tW]} />
              <meshStandardMaterial color={STONE_DRK} roughness={0.97} />
            </mesh>

            {/* 4 merlons on tower top — one per face */}
            {([
              [tx,        tH + 0.26, tz - tW * 0.38],
              [tx,        tH + 0.26, tz + tW * 0.38],
              [tx - tW * 0.38, tH + 0.26, tz],
              [tx + tW * 0.38, tH + 0.26, tz],
            ] as [number, number, number][]).map((pos, j) => (
              <mesh key={j} position={pos} castShadow>
                <boxGeometry args={[0.28, 0.44, 0.28]} />
                <meshStandardMaterial color={STONE_DRK} roughness={0.97} />
              </mesh>
            ))}

            {/* Ivy on the inward-facing side of each tower */}
            {[0.3, 0.9, 1.5].map((y, j) => (
              <mesh
                key={`tIvy${j}`}
                position={[
                  tx - sx * (tW / 2 + 0.05),
                  y,
                  tz - sz * (tW / 2 + 0.05),
                ]}
              >
                <sphereGeometry args={[0.18 + pr(j, i) * 0.08, 6, 5]} />
                <meshStandardMaterial color={j % 2 === 0 ? IVY : IVY2} roughness={0.88} />
              </mesh>
            ))}
          </group>
        )
      })}

      {/* ── Ivy climbing patches on wall inner faces ─────── */}
      {ivyPatches.map(({ x, y, z }, k) => (
        <group key={`ivy${k}`} position={[x, y, z]}>
          <mesh>
            <sphereGeometry args={[0.3, 7, 6]} />
            <meshStandardMaterial color={k % 2 === 0 ? IVY : IVY2} roughness={0.88} />
          </mesh>
          <mesh position={[pr(k, 2) * 0.28 - 0.1, 0.25, 0]}>
            <sphereGeometry args={[0.2, 6, 5]} />
            <meshStandardMaterial color={IVY} roughness={0.88} />
          </mesh>
        </group>
      ))}
    </>
  )
}
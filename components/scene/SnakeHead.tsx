'use client'
import type { SnakeTheme } from '@/lib/snackTheme'

interface Props {
  theme: SnakeTheme
}

// Head geometry faces -Z by default (north).
// The parent group in SnakeRenderer applies a Y-rotation to match movement direction.
export default function SnakeHead({ theme }: Props) {
  const base   = theme.body[1]
  const bright = theme.body[2]
  const belly  = theme.belly
  const spine  = theme.spine
  const red    = '#dd1111'

  return (
    <group>
      {/* ── SKULL / CRANIUM ──────────────────────────────────────── */}
      {/* High-res oval skull — 20×16 segs → smooth silhouette */}
      <mesh castShadow position={[0, 0.06, 0.05]} scale={[1.06, 0.72, 0.92]}>
        <sphereGeometry args={[0.38, 20, 16]} />
        <meshStandardMaterial color={base} roughness={0.42} metalness={0.05} />
      </mesh>

      {/* Crown ridge */}
      <mesh castShadow position={[0, 0.28, -0.05]} scale={[0.48, 1, 1]}>
        <sphereGeometry args={[0.22, 14, 12]} />
        <meshStandardMaterial color={bright} roughness={0.4} />
      </mesh>

      {/* ── SNOUT ────────────────────────────────────────────────── */}
      {/* Bridge of snout — capsule instead of box for smooth edges */}
      <mesh castShadow position={[0, -0.01, -0.36]} scale={[1, 0.82, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.20, 0.24, 6, 14]} />
        <meshStandardMaterial color={base} roughness={0.45} />
      </mesh>

      {/* Rounded snout tip */}
      <mesh castShadow position={[0, -0.04, -0.57]} scale={[0.9, 0.68, 1]}>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshStandardMaterial color={base} roughness={0.45} />
      </mesh>

      {/* ── JAW ──────────────────────────────────────────────────── */}
      {/* Replaced box with a wide flat capsule for smooth jaw line */}
      <mesh castShadow position={[0, -0.2, -0.10]} rotation={[0.12 + Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.16, 0.56, 4, 10]} />
        <meshStandardMaterial color={belly} roughness={0.55} />
      </mesh>

      {/* ── NECK FILLER ──────────────────────────────────────────── */}
      {/* Capsule bridge blending head → body */}
      <mesh castShadow position={[0, 0.02, 0.34]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.32, 0.08, 4, 12]} />
        <meshStandardMaterial color={base} roughness={0.45} />
      </mesh>

      {/* Spine continues from body into head */}
      <mesh position={[0, 0.31, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.025, 0.45, 10]} />
        <meshStandardMaterial color={spine} roughness={0.5} />
      </mesh>

      {/* ── CHEEK BULGES ─────────────────────────────────────────── */}
      {([-1, 1] as const).map(side => (
        <mesh key={side} castShadow position={[side * 0.34, 0.04, -0.04]} scale={[1, 0.76, 0.88]}>
          <sphereGeometry args={[0.21, 14, 10]} />
          <meshStandardMaterial color={base} roughness={0.42} />
        </mesh>
      ))}

      {/* ── EYES ─────────────────────────────────────────────────── */}
      {([-1, 1] as const).map(side => (
        <group key={side} position={[side * 0.30, 0.20, -0.22]}>
          {/* Raised eye socket */}
          <mesh castShadow>
            <sphereGeometry args={[0.13, 14, 12]} />
            <meshStandardMaterial color={spine} roughness={0.4} />
          </mesh>
          {/* White sclera */}
          <mesh position={[0, 0, -0.07]}>
            <sphereGeometry args={[0.095, 14, 12]} />
            <meshStandardMaterial color="#f2f2f2" roughness={0.12} />
          </mesh>
          {/* Dark iris */}
          <mesh position={[0, 0, -0.135]}>
            <sphereGeometry args={[0.058, 12, 12]} />
            <meshStandardMaterial color="#111111" roughness={0.08} />
          </mesh>
          {/* Vertical slit pupil */}
          <mesh position={[0, 0, -0.148]}>
            <capsuleGeometry args={[0.007, 0.055, 3, 6]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          {/* Shine spot */}
          <mesh position={[0.03, 0.03, -0.15]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              roughness={0.0}
              emissive="#ffffff"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}

      {/* ── NOSTRILS ─────────────────────────────────────────────── */}
      {([-1, 1] as const).map(side => (
        <mesh key={side} position={[side * 0.11, 0.05, -0.70]}>
          <sphereGeometry args={[0.036, 10, 8]} />
          <meshStandardMaterial color={spine} roughness={0.9} />
        </mesh>
      ))}

      {/* ── FORKED TONGUE ────────────────────────────────────────── */}
      {/* Base — thin capsule */}
      <mesh position={[0, -0.17, -0.73]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.010, 0.10, 3, 6]} />
        <meshStandardMaterial color={red} roughness={0.3} />
      </mesh>
      {/* Left fork */}
      <mesh position={[-0.055, -0.175, -0.875]} rotation={[Math.PI / 2, -0.32, 0]}>
        <capsuleGeometry args={[0.007, 0.09, 3, 6]} />
        <meshStandardMaterial color={red} roughness={0.3} />
      </mesh>
      {/* Right fork */}
      <mesh position={[0.055, -0.175, -0.875]} rotation={[Math.PI / 2, 0.32, 0]}>
        <capsuleGeometry args={[0.007, 0.09, 3, 6]} />
        <meshStandardMaterial color={red} roughness={0.3} />
      </mesh>
    </group>
  )
}
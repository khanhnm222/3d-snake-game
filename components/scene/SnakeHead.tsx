'use client'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { SnakeTheme } from '@/lib/snakeTheme'
import { hornGeometry } from './objects/procedural'
import { dragonSkinParams } from './snakeTube'

interface Props {
  theme: SnakeTheme
  /** 'sad' dims the fierce amber glare to a dull, downcast look and stills the tongue */
  mood?: 'normal' | 'sad'
}

// Head geometry faces -Z by default (north).
// The parent group in SnakeRenderer applies a Y-rotation to match movement direction.
export default function SnakeHead({ theme, mood = 'normal' }: Props) {
  const sad    = mood === 'sad'
  const base   = theme.body[1]
  const bright = theme.body[2]
  const belly  = theme.belly
  const spine  = theme.spine
  const red    = '#c8102e'
  const iris   = sad ? '#8892a0' : '#d8a018'   // amber glare, or a dull downcast grey when sad

  // Dragon hide without vertex colours (head parts are plain primitives)
  const hide      = useMemo(() => ({ ...dragonSkinParams(), vertexColors: false, bumpScale: 1.1 }), [])
  const scales    = hide.map
  const horn      = useMemo(() => hornGeometry(0.4, 0.06, 1.2), [])
  const crest     = useMemo(() => hornGeometry(0.16, 0.05, 0.9), [])
  const hornCol   = useMemo(() => new THREE.Color(spine).lerp(new THREE.Color('#e8dcc0'), 0.45), [spine])
  const tongueRef = useRef<THREE.Group>(null)

  // Tongue flick: two quick in-out darts, then a pause (stilled entirely when sad)
  useFrame(({ clock }) => {
    const g = tongueRef.current
    if (!g) return
    if (sad) { g.visible = false; return }
    const k = (clock.elapsedTime % 2.6) / 2.6
    const dart = (c: number) => Math.max(0, 1 - Math.abs(k - c) / 0.06)
    const out = Math.max(dart(0.08), dart(0.22))
    g.scale.z = 0.05 + out * 0.95
    g.visible = out > 0.02
    g.rotation.x = Math.sin(clock.elapsedTime * 40) * 0.12 * out  // flutter while extended
  })

  // Iridescent dragon hide shared by all head parts
  const skin = (color: string, rough = 0.36) => (
    <meshPhysicalMaterial {...hide} color={color} roughness={rough} />
  )
  const hornMat = <meshPhysicalMaterial color={hornCol} roughness={0.3} metalness={0.1} clearcoat={0.8} clearcoatRoughness={0.2} />

  return (
    <group>
      {/* ── SKULL / CRANIUM ──────────────────────────────────────── */}
      {/* High-res oval skull — 20×16 segs → smooth silhouette */}
      <mesh castShadow receiveShadow position={[0, 0.06, 0.05]} scale={[1.06, 0.72, 0.92]}>
        <sphereGeometry args={[0.38, 20, 16]} />
        {skin(base, 0.42)}
      </mesh>

      {/* Crown ridge */}
      <mesh castShadow receiveShadow position={[0, 0.28, -0.05]} scale={[0.48, 1, 1]}>
        <sphereGeometry args={[0.22, 14, 12]} />
        {skin(bright, 0.4)}
      </mesh>

      {/* ── SNOUT ────────────────────────────────────────────────── */}
      {/* Bridge of snout — capsule instead of box for smooth edges */}
      <mesh castShadow receiveShadow position={[0, -0.01, -0.36]} scale={[1, 0.82, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.20, 0.24, 6, 14]} />
        {skin(base, 0.45)}
      </mesh>

      {/* Rounded snout tip */}
      <mesh castShadow receiveShadow position={[0, -0.04, -0.57]} scale={[0.9, 0.68, 1]}>
        <sphereGeometry args={[0.22, 16, 12]} />
        {skin(base, 0.45)}
      </mesh>

      {/* ── JAW ──────────────────────────────────────────────────── */}
      {/* Replaced box with a wide flat capsule for smooth jaw line */}
      <mesh castShadow receiveShadow position={[0, -0.2, -0.10]} rotation={[0.12 + Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.16, 0.56, 4, 10]} />
        <meshStandardMaterial color={belly} roughness={0.55} />
      </mesh>

      {/* ── NECK FILLER ──────────────────────────────────────────── */}
      {/* Capsule bridge blending head → body */}
      <mesh castShadow receiveShadow position={[0, 0.02, 0.34]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.32, 0.08, 4, 12]} />
        {skin(base, 0.45)}
      </mesh>

      {/* Dorsal marking continues from body onto the crown */}
      <mesh position={[0, 0.305, 0.1]} scale={[0.1, 0.035, 0.26]}>
        <sphereGeometry args={[1, 14, 8]} />
        <meshPhysicalMaterial color={spine} map={scales} roughness={0.5} clearcoat={0.4} />
      </mesh>

      {/* ── MOUTH LINE ───────────────────────────────────────────── */}
      {([-1, 1] as const).map(side => (
        <mesh key={`lip${side}`} position={[side * 0.17, -0.105, -0.36]} rotation={[Math.PI / 2, 0, side * -0.22]}>
          <capsuleGeometry args={[0.012, 0.42, 3, 6]} />
          <meshStandardMaterial color="#1a1410" roughness={0.7} />
        </mesh>
      ))}

      {/* ── CHEEK BULGES ─────────────────────────────────────────── */}
      {([-1, 1] as const).map(side => (
        <mesh key={side} castShadow receiveShadow position={[side * 0.34, 0.04, -0.04]} scale={[1, 0.76, 0.88]}>
          <sphereGeometry args={[0.21, 14, 10]} />
          {skin(base, 0.42)}
        </mesh>
      ))}

      {/* ── EYES ─────────────────────────────────────────────────── */}
      {([-1, 1] as const).map(side => (
        <group key={side} position={[side * 0.30, 0.20, -0.22]}>
          {/* Raised eye socket */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.13, 14, 12]} />
            {skin(spine, 0.4)}
          </mesh>
          {/* Supraocular (brow) scale — stern when normal, heavy and drooping when sad */}
          <mesh
            castShadow
            position={[side * -0.01, sad ? 0.05 : 0.085, sad ? -0.015 : -0.05]}
            rotation={[sad ? 0.62 : 0.2, 0, side * 0.25]}
            scale={[0.12, sad ? 0.06 : 0.035, 0.14]}
          >
            <sphereGeometry args={[1, 12, 8]} />
            {skin(bright, 0.38)}
          </mesh>
          {/* White sclera */}
          <mesh position={[0, 0, -0.07]}>
            <sphereGeometry args={[0.095, 14, 12]} />
            <meshStandardMaterial color="#f2f2f2" roughness={0.12} />
          </mesh>
          {/* Iris — fierce amber glare, or dim and cool when sad */}
          <mesh position={[0, 0, -0.128]}>
            <sphereGeometry args={[0.062, 16, 12]} />
            <meshPhysicalMaterial
              color={iris}
              roughness={0.15}
              clearcoat={1}
              clearcoatRoughness={0.02}
              emissive={sad ? '#2a3040' : '#ff8a00'}
              emissiveIntensity={sad ? 0.12 : 0.55}
            />
          </mesh>
          {/* Vertical slit pupil */}
          <mesh position={[0, 0, -0.186]}>
            <capsuleGeometry args={[0.009, 0.07, 3, 6]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          {/* Shine spot — a sharp sparkle, or a duller, teary glint when sad */}
          <mesh position={[0.025, 0.028, -0.185]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              roughness={0.0}
              emissive="#ffffff"
              emissiveIntensity={sad ? 0.22 : 0.5}
            />
          </mesh>
        </group>
      ))}

      {/* ── NOSTRILS ─────────────────────────────────────────────── */}
      {([-1, 1] as const).map(side => (
        <mesh key={side} position={[side * 0.11, 0.05, -0.70]}>
          <sphereGeometry args={[0.036, 10, 8]} />
          <meshStandardMaterial color="#140e0a" roughness={0.9} />
        </mesh>
      ))}

      {/* ── DRAGON HORNS — swept low and back from behind the eyes so
           they frame, not block, the first-person view ───────────── */}
      {([-1, 1] as const).map(side => (
        <mesh key={`horn${side}`} geometry={horn} position={[side * 0.2, 0.25, 0.12]} rotation={[1.05, 0, side * -0.45]} castShadow>
          {hornMat}
        </mesh>
      ))}

      {/* Crest of small spikes along the crown, leading into the dorsal row */}
      {[-0.12, 0.06, 0.24].map((z, i) => (
        <mesh key={`crest${i}`} geometry={crest} position={[0, 0.33 - i * 0.015, z]} rotation={[0.75, 0, 0]} scale={0.6 + i * 0.12} castShadow>
          {hornMat}
        </mesh>
      ))}

      {/* Cheek spikes — a frill of short barbs behind the jaw */}
      {([-1, 1] as const).flatMap(side => [0, 1].map(j => (
        <mesh
          key={`cheek${side}${j}`}
          geometry={crest}
          position={[side * (0.46 - j * 0.03), 0.02 - j * 0.1, 0.02 + j * 0.1]}
          rotation={[0.9, 0, side * -(1.2 + j * 0.25)]}
          scale={1.1 - j * 0.25}
          castShadow
        >
          {hornMat}
        </mesh>
      )))}

      {/* ── FORKED TONGUE (flicks in and out) ───────────────────── */}
      <group ref={tongueRef} position={[0, -0.17, -0.66]}>
        {/* Base — thin capsule */}
        <mesh position={[0, 0, -0.07]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.010, 0.10, 3, 6]} />
          <meshStandardMaterial color={red} roughness={0.3} />
        </mesh>
        {/* Left fork */}
        <mesh position={[-0.055, -0.005, -0.215]} rotation={[Math.PI / 2, -0.32, 0]}>
          <capsuleGeometry args={[0.007, 0.09, 3, 6]} />
          <meshStandardMaterial color={red} roughness={0.3} />
        </mesh>
        {/* Right fork */}
        <mesh position={[0.055, -0.005, -0.215]} rotation={[Math.PI / 2, 0.32, 0]}>
          <capsuleGeometry args={[0.007, 0.09, 3, 6]} />
          <meshStandardMaterial color={red} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}
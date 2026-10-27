'use client'
import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/store'
import { SNAKE_THEMES } from '@/lib/snakeTheme'
import { useNightMode } from '@/hooks/useNightMode'
import { useIsTouch } from '@/hooks/useIsTouch'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import SnakeHead from './scene/SnakeHead'
import { SnakeTube, type PathPoint } from './scene/snakeTube'
import Tree      from './scene/objects/Tree'
import Rock      from './scene/objects/Rock'
import Plant     from './scene/objects/Plant'
import Flower    from './scene/objects/Flower'
import Mushroom  from './scene/objects/Mushroom'
import GrassTuft from './scene/objects/GrassTuft'
import Pond      from './scene/objects/Pond'
import Fireflies from './scene/objects/Fireflies'
import { fbm, pr } from './scene/objects/procedural'

// ── Showcase diorama behind the menu / game-over screens ─────────────
// A coiled dragon-snake (in the player's chosen colours) on a small garden
// clearing, lit to match the chosen sky. The camera drifts slowly and the
// framing adapts: scene on the left on wide screens (UI card on the right),
// full-width in the top area on phones.

export type MenuMode = 'menu' | 'gameover'

interface Palette {
  bg: string
  fog: [number, number]
  ground: [string, string]
  ambient: [string, number]
  hemi: [string, string, number]
  key: [string, number, [number, number, number]]
  rim: [string, number]
}

// The game-over diorama reuses the same natural day/night palette as the
// menu — only the snake itself (pose, dim local light, dull eyes) carries
// the "sad" mood. An earlier version gave game-over its own scorched-red
// palette, but that read as the environment being angry, not the snake.
const PALETTES: Record<'day' | 'night', Palette> = {
  day: {
    bg: '#8fc7e4', fog: [13, 34], ground: ['#3f8a3c', '#2c6a30'],
    ambient: ['#d8ecc8', 0.45], hemi: ['#a8d8f0', '#2e6830', 0.6],
    key: ['#ffe0a8', 2.0, [6, 9, 5]], rim: ['#b8e0ff', 0.7],
  },
  night: {
    bg: '#0b1224', fog: [12, 30], ground: ['#1f4a30', '#132e20'],
    ambient: ['#3a5080', 0.55], hemi: ['#23346a', '#0a1020', 0.6],
    key: ['#c8dcff', 1.5, [-6, 10, 6]], rim: ['#6a8cff', 1.1],
  },
}

// ── Decorations (deterministic layout; foreground kept clear for the snake) ──
type Deco = { kind: 'tree' | 'rock' | 'plant' | 'mushroom' | 'flower' | 'grass'; x: number; z: number; s: number; r: number; v: number }
const DECOR: Deco[] = [
  { kind: 'tree', x: -5.6, z: -4.4, s: 1.25, r: 0.3, v: 0 },
  { kind: 'tree', x:  5.9, z: -5.0, s: 1.1,  r: 1.2, v: 1 },
  { kind: 'tree', x: -8.2, z:  1.2, s: 1.0,  r: 2.0, v: 2 },
  { kind: 'tree', x:  8.4, z:  0.4, s: 1.15, r: 0.5, v: 0 },
  { kind: 'tree', x: -2.6, z: -8.2, s: 1.3,  r: 1.0, v: 1 },
  { kind: 'tree', x:  3.4, z: -8.8, s: 1.2,  r: 2.2, v: 2 },
  { kind: 'rock', x:  3.3, z:  1.6, s: 0.8,  r: 0.8, v: 0 },
  { kind: 'rock', x: -3.5, z:  1.0, s: 0.6,  r: 1.6, v: 1 },
  { kind: 'rock', x:  2.4, z: -3.0, s: 0.55, r: 2.3, v: 2 },
  { kind: 'rock', x: -1.9, z: -3.4, s: 0.9,  r: 0.4, v: 0 },
  { kind: 'rock', x:  5.0, z:  3.6, s: 0.7,  r: 1.9, v: 1 },
  { kind: 'mushroom', x: -2.8, z:  2.5, s: 0.9, r: 0.0, v: 0 },
  { kind: 'mushroom', x: -2.3, z:  3.1, s: 0.6, r: 1.4, v: 1 },
  { kind: 'mushroom', x:  3.7, z: -1.3, s: 0.8, r: 2.6, v: 2 },
  { kind: 'plant', x: -4.3, z: -1.6, s: 1.1, r: 0.2, v: 0 },
  { kind: 'plant', x:  4.4, z: -2.9, s: 1.0, r: 1.3, v: 1 },
  { kind: 'plant', x: -1.0, z: -4.6, s: 0.9, r: 2.4, v: 2 },
  { kind: 'plant', x:  3.0, z:  3.9, s: 0.8, r: 0.9, v: 0 },
  ...Array.from({ length: 10 }, (_, i): Deco => {
    const a = (i / 10) * Math.PI * 2 + 0.4
    const r = 3.0 + pr(i, 31) * 2.2
    return { kind: 'flower', x: Math.cos(a) * r, z: Math.sin(a) * r * 0.9 - 0.4, s: 0.9 + pr(i, 32) * 0.3, r: pr(i, 33) * 6, v: i }
  }),
  ...Array.from({ length: 16 }, (_, i): Deco => {
    const a = pr(i, 41) * Math.PI * 2
    const r = 3.2 + pr(i, 42) * 4
    return { kind: 'grass', x: Math.cos(a) * r, z: Math.sin(a) * r, s: 1 + pr(i, 43) * 0.3, r: pr(i, 44) * 6, v: i }
  }),
]

function Decorations() {
  return (
    <>
      {DECOR.map((d, i) => {
        const props = { position: [d.x, 0, d.z] as [number, number, number], scale: d.s, rotation: d.r, variant: d.v }
        switch (d.kind) {
          case 'tree':     return <Tree      key={i} {...props} />
          case 'rock':     return <Rock      key={i} {...props} />
          case 'plant':    return <Plant     key={i} {...props} />
          case 'mushroom': return <Mushroom  key={i} {...props} />
          case 'flower':   return <Flower    key={i} {...props} />
          case 'grass':    return <GrassTuft key={i} {...props} />
        }
      })}
      <Pond position={[-5.2, 0, 4.4]} scale={0.55} />
    </>
  )
}

// ── Ground: noisy two-tone lawn fading into the fog ───────────────────
function Lawn({ colors }: { colors: [string, string] }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(44, 44, 64, 64)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position as THREE.BufferAttribute
    const cols = new Float32Array(pos.count * 3)
    const a = new THREE.Color(colors[0]), b = new THREE.Color(colors[1]), c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const n = fbm(x * 0.25, z * 0.25, 0.7, 5, 3) * 0.5 + 0.5
      c.copy(a).lerp(b, THREE.MathUtils.clamp(n * 1.2 - 0.1, 0, 1))
      cols.set([c.r, c.g, c.b], i * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3))
    return g
  }, [colors])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <mesh geometry={geo} position={[0, -0.01, 0]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.95} />
    </mesh>
  )
}

// ── Coiled dragon-snake ───────────────────────────────────────────────
const COIL_R0    = 0.95   // inner coil radius
const COIL_PITCH = 0.9    // radius growth per turn (≈ body width → tight coil)
const COIL_TURNS = 2.1
const COIL_DS    = 0.75   // spacing between path points
const HEAD_Y     = 0.25

const _path: PathPoint[] = []
const _euler = new THREE.Euler(0, 0, 0, 'YXZ')

// Head rears up from the centre of the coil (menu); on game-over it hangs
// low over the coil instead, in a slow, heavy sigh rather than an alert rear.
function buildCoil(out: PathPoint[], t: number, mode: MenuMode) {
  out.length = 0
  const menu = mode === 'menu'
  const raise = menu ? 1 : 0.14
  const breathe = Math.sin(t * (menu ? 1.3 : 0.5)) * (menu ? 0.04 : 0.05)
  const sway = menu ? Math.sin(t * 0.55) * 0.28 : 0.04

  const hx = sway, hz = menu ? 0.25 : 0.55
  const s0x = 0, s0z = -COIL_R0
  out.push({ x: hx, z: hz, lift: 1.05 * raise + breathe })
  out.push({ x: THREE.MathUtils.lerp(hx, s0x, 0.4), z: THREE.MathUtils.lerp(hz, s0z, 0.4), lift: 0.8 * raise + breathe * 0.6 })
  out.push({ x: THREE.MathUtils.lerp(hx, s0x, 0.75), z: THREE.MathUtils.lerp(hz, s0z, 0.75), lift: 0.38 * raise })

  const th0 = -Math.PI / 2
  let th = th0, r = COIL_R0
  while ((th - th0) / (Math.PI * 2) < COIL_TURNS) {
    out.push({ x: Math.cos(th) * r, z: Math.sin(th) * r })
    th += COIL_DS / r
    r = COIL_R0 + COIL_PITCH * (th - th0) / (Math.PI * 2) + breathe * 0.3
  }
}

function DisplaySnake({ mode }: { mode: MenuMode }) {
  const themeIdx = useGameStore(s => s.snakeThemeIdx)
  const theme    = useMemo(() => SNAKE_THEMES[themeIdx] ?? SNAKE_THEMES[0], [themeIdx])
  const tube     = useMemo(() => new SnakeTube({ heightAt: () => 0 }), [])
  const headRef  = useRef<THREE.Group>(null)
  useEffect(() => { tube.setTheme(theme) }, [tube, theme])
  useEffect(() => () => tube.dispose(), [tube])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    buildCoil(_path, t, mode)
    tube.update(_path, t * (mode === 'menu' ? 0.35 : 0.12))

    const g = headRef.current
    if (!g) return
    const h = _path[0], n = _path[1]
    g.position.set(h.x, HEAD_Y + (h.lift ?? 0), h.z)
    // Menu: face away from the neck, glance around, nose slightly down.
    // Game-over: no alert glancing — head just hangs low and nods gently.
    const yaw = Math.atan2(-(h.x - n.x), -(h.z - n.z)) + (mode === 'menu' ? Math.sin(t * 0.4) * 0.35 : Math.sin(t * 0.15) * 0.05)
    _euler.set(mode === 'menu' ? -0.12 + Math.sin(t * 0.9) * 0.05 : 0.36 + Math.sin(t * 0.5) * 0.03, yaw, 0)
    g.quaternion.setFromEuler(_euler)
  })

  return (
    <>
      <primitive object={tube.group} />
      <group ref={headRef}>
        <SnakeHead theme={theme} mood={mode === 'gameover' ? 'sad' : 'normal'} />
      </group>
    </>
  )
}

// ── Camera: slow drift + responsive framing ───────────────────────────
// `sideBySide` must track the same condition as ScreenShell's `md:landscape:`
// breakpoint (card floats beside the scene) rather than the diorama
// container's own pixel aspect — on a portrait tablet that container is
// still short-and-wide (top 46dvh strip), which would otherwise misfire
// the "shift snake left for the card" framing even though the card sits
// below the scene, not beside it.
function CameraRig({ mode, sideBySide }: { mode: MenuMode; sideBySide: boolean }) {
  useFrame(({ clock, camera, size }) => {
    const cam = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const wide = sideBySide
    // Wide: render into a virtual frame 1.4× wider so the snake sits at ~30%
    // from the left, leaving the right side for the UI card.
    const extra = wide ? 1.4 : 1
    cam.fov = wide ? 36 : 44
    cam.aspect = aspect * extra
    if (wide) cam.setViewOffset(size.width * extra, size.height, size.width * (extra - 1), 0, size.width, size.height)
    else cam.clearViewOffset()

    // Distance that fits the coil + nearby props both vertically and horizontally
    const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))
    const D = Math.max(2.7 / tanV, 4.4 / (tanV * Math.min(cam.aspect, 2)))
    const t = clock.elapsedTime
    const a = Math.sin(t * 0.09) * 0.5 + (mode === 'gameover' ? 0.35 : 0)
    cam.position.set(Math.sin(a) * D, D * 0.36 + Math.sin(t * 0.2) * 0.15, Math.cos(a) * D)
    cam.lookAt(0, 0.75, 0)
    cam.updateProjectionMatrix()
  })
  return null
}

export default function MenuScene({ mode }: { mode: MenuMode }) {
  const skyMode    = useGameStore(s => s.skyMode)
  const systemDark = useNightMode()
  const touch      = useIsTouch()
  const sideBySide = useMediaQuery('(min-width: 768px) and (orientation: landscape)')
  const night      = skyMode === 'auto' ? systemDark : skyMode === 'night'
  const P          = PALETTES[night ? 'night' : 'day']
  const shadowRes  = touch ? 1024 : 2048

  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, touch ? 1.25 : 1.5]}
      gl={{ antialias: true }}
      camera={{ fov: 40, near: 0.1, far: 80, position: [0, 3.5, 9] }}
      style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      <color attach="background" args={[P.bg]} />
      <fog attach="fog" args={[P.bg, P.fog[0], P.fog[1]]} />

      <ambientLight color={P.ambient[0]} intensity={P.ambient[1]} />
      <hemisphereLight args={[P.hemi[0], P.hemi[1], P.hemi[2]]} />
      <directionalLight
        position={P.key[2]}
        color={P.key[0]}
        intensity={P.key[1]}
        castShadow
        shadow-mapSize-width={shadowRes}
        shadow-mapSize-height={shadowRes}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={3}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
        shadow-camera-far={40}
      />
      {/* Rim light from behind — outlines the dragon's silhouette and spikes */}
      <directionalLight position={[0, 4, -8]} color={P.rim[0]} intensity={P.rim[1]} />
      {/* Snake-local glow: warm and bright on the menu; a dim, cool, mournful
          light on game-over. This is scoped to the snake, not the palette
          above, so the garden itself stays the same natural day/night scene
          in both screens — only the dragon's own mood light and pose differ. */}
      <pointLight
        position={mode === 'gameover' ? [0, 1.0, 1.2] : [0, 1.6, 1.6]}
        color={mode === 'gameover' ? '#7684a0' : '#ffd8a0'}
        intensity={mode === 'gameover' ? 1.1 : 1.2}
        distance={6}
        decay={2}
      />

      <Lawn colors={P.ground} />
      <Decorations />
      <DisplaySnake mode={mode} />
      {night && <Fireflies />}
      <CameraRig mode={mode} sideBySide={sideBySide} />
    </Canvas>
  )
}

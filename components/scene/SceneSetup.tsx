'use client'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'

// ── Palette per mode ─────────────────────────────────────────────────

const DAY = {
  fog:        { color: '#3d6e52', near: 12, far: 38 },
  background: '#5ab8e8',
  ambient:    { color: '#b8d4a0', intensity: 0.45 },
  sun:        { pos: [8, 16, -14] as [number, number, number], color: '#ffc870', intensity: 1.7 },
  fill:       { pos: [-10, 4, 14] as [number, number, number], color: '#90c0e0', intensity: 0.22 },
  hemi:       { sky: '#5ab0d8', ground: '#2e6830', intensity: 0.5 },
  pond:       { color: '#50aaff', intensity: 0.7 },
  torch:      { color: '#ff8830', intensity: 0.55 },
  center:     { color: '#a0ffb0', intensity: 0.18 },
}

const NIGHT = {
  fog:        { color: '#0e1222', near: 18, far: 48 },   // pushed back → see the whole arena
  background: '#080c1a',
  ambient:    { color: '#3a5080', intensity: 0.70 },     // strong blue-white ambient so everything is readable
  sun:        { pos: [-15, 22, -20] as [number, number, number], color: '#c8dcff', intensity: 1.6 }, // bright cold moonlight
  fill:       { pos: [15, 6, 18]  as [number, number, number], color: '#3050b0', intensity: 0.30 }, // opposite-side sky bounce
  hemi:       { sky: '#1e2e60', ground: '#080e22', intensity: 0.55 },
  pond:       { color: '#5090ff', intensity: 1.0 },
  torch:      { color: '#ff7820', intensity: 0.70 },
  center:     { color: '#6080e0', intensity: 0.35 },
}

export default function SceneSetup({ darkMode }: { darkMode: boolean }) {
  const { scene } = useThree()
  const P = darkMode ? NIGHT : DAY

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    scene.fog = new THREE.Fog(P.fog.color, P.fog.near, P.fog.far)
    scene.background = new THREE.Color(P.background)
  }, [scene, darkMode, P])

  return (
    <>
      <ambientLight intensity={P.ambient.intensity} color={P.ambient.color} />

      {/* Primary directional light — sun (day) or moon (night) */}
      <directionalLight
        position={P.sun.pos}
        intensity={P.sun.intensity}
        color={P.sun.color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={65}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
      />

      <directionalLight position={P.fill.pos} intensity={P.fill.intensity} color={P.fill.color} />

      <hemisphereLight args={[P.hemi.sky, P.hemi.ground, P.hemi.intensity]} />

      {/* Pond glow */}
      <pointLight position={[-10, 1.8, -10]} intensity={P.pond.intensity} color={P.pond.color} distance={9} decay={2} />

      {/* Torch / fire glow */}
      <pointLight position={[11, 2.5, 11]} intensity={P.torch.intensity} color={P.torch.color} distance={11} decay={2} />

      {/* Center atmosphere */}
      <pointLight position={[0, 3, 0]} intensity={P.center.intensity} color={P.center.color} distance={20} decay={1} />
    </>
  )
}
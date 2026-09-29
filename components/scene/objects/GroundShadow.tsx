'use client'
import { useMemo } from 'react'
import { radialTexture } from './procedural'

interface Props {
  /** Radius in local units */
  radius?: number
  /** Stretch along Z (e.g. for elongated objects) */
  stretch?: number
  opacity?: number
  /** Height above the ground plane (world y≈0) */
  y?: number
}

// Soft ambient-occlusion "contact shadow" under an object.
// The directional-light shadow map gives the long cast shadow; this adds the
// dark soft patch where an object touches the ground, which is what makes
// things read as grounded instead of floating.
export default function GroundShadow({ radius = 0.5, stretch = 1, opacity = 0.45, y = 0.006 }: Props) {
  const map = useMemo(() => radialTexture(), [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} scale={[radius * 2, radius * 2 * stretch, 1]} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={map}
        color="#000000"
        transparent
        opacity={opacity}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  )
}

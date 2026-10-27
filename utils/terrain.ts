import type { Direction, Obstacle, Position } from '../types'
import { ROUND1_OBSTACLES } from '../configs/mapData'

// ── Terrain + obstacle rules ─────────────────────────────────────────
// Shared by the game logic (collisions, food spawning) and the renderer
// (snake / camera height, obstacle meshes), so both always agree.

function smooth01(t: number): number {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

/** Local coordinates of a world point relative to a pipe / slope: u along axis, v across */
export function toLocal(ob: Obstacle, x: number, z: number): { u: number; v: number } {
  const dx = x - ob.position.x
  const dz = z - ob.position.z
  return ob.axis === 'x' ? { u: dx, v: dz } : { u: dz, v: dx }
}

/** Ramp profile along the slope: 0 at the ends, full height across the deck */
export const SLOPE_RAMP = 2 // cells of ramp at each end

export function slopeHeight(ob: Obstacle, u: number, v: number): number {
  if (Math.abs(v) > ob.width / 2) return 0
  return ob.height * smooth01((ob.length / 2 - Math.abs(u)) / SLOPE_RAMP)
}

export function hillHeight(ob: Obstacle, x: number, z: number): number {
  const d = Math.hypot(x - ob.position.x, z - ob.position.z)
  return ob.height * smooth01(1 - d / ob.radius)
}

/** Ground height at any world point (continuous — used for smooth rendering) */
export function terrainHeight(x: number, z: number, obstacles: Obstacle[] = ROUND1_OBSTACLES): number {
  let h = 0
  for (const ob of obstacles) {
    if (ob.type === 'hill') {
      h = Math.max(h, hillHeight(ob, x, z))
    } else if (ob.type === 'slope') {
      const { u, v } = toLocal(ob, x, z)
      h = Math.max(h, slopeHeight(ob, u, v))
    }
  }
  return h
}

function inFootprint(ob: Obstacle, cell: Position): boolean {
  const { u, v } = toLocal(ob, cell.x, cell.z)
  return Math.abs(u) <= (ob.length - 1) / 2 && Math.abs(v) <= (ob.width - 1) / 2
}

const AXIS_OF: Record<Direction, 'x' | 'z'> = { north: 'z', south: 'z', east: 'x', west: 'x' }

/**
* True when moving into `head` with `dir` hits an obstacle wall:
* pipes and slopes may only be entered and travelled along their axis —
* coming in from the side, or turning while inside, is a crash.
*/
export function checkObstacleCollision(head: Position, dir: Direction, obstacles: Obstacle[] = ROUND1_OBSTACLES): boolean {
  return obstacles.some(ob =>
    ob.type !== 'hill' && inFootprint(ob, head) && AXIS_OF[dir] !== ob.axis,
  )
}

/** All grid cells covered by obstacles — food never spawns here */
export function obstacleCells(obstacles: Obstacle[] = ROUND1_OBSTACLES): Position[] {
  const cells: Position[] = []
  for (const ob of obstacles) {
    if (ob.type === 'hill') {
      const r = Math.ceil(ob.radius)
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.hypot(dx, dz) < ob.radius) cells.push({ x: ob.position.x + dx, z: ob.position.z + dz })
        }
      }
    } else {
      const hl = (ob.length - 1) / 2, hw = (ob.width - 1) / 2
      for (let u = -hl; u <= hl; u++) {
        for (let v = -hw; v <= hw; v++) {
          cells.push(ob.axis === 'x'
            ? { x: ob.position.x + u, z: ob.position.z + v }
            : { x: ob.position.x + v, z: ob.position.z + u })
        }
      }
    }
  }
  return cells
}

/** True when a world point is inside a pipe (used to fade the pipe for visibility) */
export function insidePipe(x: number, z: number, ob: Obstacle, margin = 0.6): boolean {
  const { u, v } = toLocal(ob, x, z)
  return Math.abs(u) <= ob.length / 2 + margin && Math.abs(v) <= 0.6
}

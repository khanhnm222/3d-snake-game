import type { FoodItem, MapObject, Level } from '../types'

export const ROUND1_LEVEL: Level = {
  size: 15,   // grid runs -15..15 (30x30 play area)
  speed: 350, // ms per tick
}

// Deterministic starting food for round 1
export const ROUND1_FOOD: FoodItem[] = [
  { id: 'f1', position: { x: -4, z: -5 }, type: 'apple',  points: 10 },
  { id: 'f2', position: { x:  5, z:  4 }, type: 'orange', points: 10 },
  { id: 'f3', position: { x: -8, z:  3 }, type: 'grape',  points: 15 },
  { id: 'f4', position: { x:  3, z: -9 }, type: 'berry',  points: 15 },
  { id: 'f5', position: { x:  9, z:  2 }, type: 'banana', points: 20 },
]

// All decorative objects placed so they never collide with the
// starting snake (0,0),(0,1),(0,2) or with initial food above.
export const ROUND1_OBJECTS: MapObject[] = [
  // ── Rocks ──────────────────────────────────────────────────
  { id: 'r1',  type: 'rock',     position: { x: -13, z: -13 }, scale: 1.2, rotation: 0.3,  variant: 0 },
  { id: 'r2',  type: 'rock',     position: { x: -10, z:  -8 }, scale: 0.9, rotation: 1.1,  variant: 1 },
  { id: 'r3',  type: 'rock',     position: { x:   9, z: -12 }, scale: 1.0, rotation: 2.5,  variant: 0 },
  { id: 'r4',  type: 'rock',     position: { x:  13, z:  -6 }, scale: 1.3, rotation: 0.8,  variant: 2 },
  { id: 'r5',  type: 'rock',     position: { x: -13, z:   3 }, scale: 0.8, rotation: 1.7,  variant: 1 },
  { id: 'r6',  type: 'rock',     position: { x:  12, z:  11 }, scale: 1.1, rotation: 3.1,  variant: 0 },
  { id: 'r7',  type: 'rock',     position: { x:  -7, z:  13 }, scale: 0.7, rotation: 0.5,  variant: 2 },
  { id: 'r8',  type: 'rock',     position: { x:   6, z: -14 }, scale: 1.0, rotation: 2.0,  variant: 1 },
  { id: 'r9',  type: 'rock',     position: { x:  -2, z:   9 }, scale: 0.6, rotation: 1.3,  variant: 0 },
  { id: 'r10', type: 'rock',     position: { x:  14, z:  -3 }, scale: 0.9, rotation: 0.9,  variant: 2 },

  // ── Plants ─────────────────────────────────────────────────
  { id: 'p1',  type: 'plant',    position: { x:  -9, z:  -6 }, scale: 1.0, rotation: 0.0,  variant: 0 },
  { id: 'p2',  type: 'plant',    position: { x:   8, z:  -8 }, scale: 1.2, rotation: 0.7,  variant: 1 },
  { id: 'p3',  type: 'plant',    position: { x:  -7, z:  10 }, scale: 0.9, rotation: 1.4,  variant: 0 },
  { id: 'p4',  type: 'plant',    position: { x:  11, z:   4 }, scale: 1.1, rotation: 2.1,  variant: 2 },
  { id: 'p5',  type: 'plant',    position: { x: -12, z:  -2 }, scale: 0.8, rotation: 3.0,  variant: 1 },
  { id: 'p6',  type: 'plant',    position: { x:   4, z:  12 }, scale: 1.0, rotation: 0.3,  variant: 0 },
  { id: 'p7',  type: 'plant',    position: { x: -10, z:   7 }, scale: 0.7, rotation: 1.8,  variant: 2 },
  { id: 'p8',  type: 'plant',    position: { x:   7, z:  -5 }, scale: 1.3, rotation: 2.7,  variant: 1 },

  // ── Flowers ────────────────────────────────────────────────
  { id: 'fl1', type: 'flower',   position: { x:  -6, z:  -4 }, scale: 1.0, rotation: 0.0,  variant: 0 },
  { id: 'fl2', type: 'flower',   position: { x:   4, z: -10 }, scale: 1.0, rotation: 1.0,  variant: 1 },
  { id: 'fl3', type: 'flower',   position: { x:  -3, z:   8 }, scale: 1.0, rotation: 2.0,  variant: 2 },
  { id: 'fl4', type: 'flower',   position: { x:  10, z:  -3 }, scale: 1.0, rotation: 3.0,  variant: 3 },
  { id: 'fl5', type: 'flower',   position: { x:  -8, z: -11 }, scale: 1.0, rotation: 0.5,  variant: 0 },
  { id: 'fl6', type: 'flower',   position: { x:   7, z:   9 }, scale: 1.0, rotation: 1.5,  variant: 2 },

  // ── Mushrooms ──────────────────────────────────────────────
  { id: 'm1',  type: 'mushroom', position: { x: -12, z:   5 }, scale: 1.0, rotation: 0.0,  variant: 0 },
  { id: 'm2',  type: 'mushroom', position: { x:  11, z: -10 }, scale: 1.2, rotation: 2.2,  variant: 1 },
  { id: 'm3',  type: 'mushroom', position: { x:  -5, z: -13 }, scale: 0.8, rotation: 1.1,  variant: 0 },
  { id: 'm4',  type: 'mushroom', position: { x:   9, z:   7 }, scale: 1.1, rotation: 3.1,  variant: 1 },

  // ── Trees ──────────────────────────────────────────────────
  { id: 't1',  type: 'tree',     position: { x: -14, z:  -8 }, scale: 1.0, rotation: 0.0,  variant: 0 },
  { id: 't2',  type: 'tree',     position: { x:  12, z:   6 }, scale: 1.2, rotation: 1.2,  variant: 1 },
  { id: 't3',  type: 'tree',     position: { x:  -6, z:  14 }, scale: 0.9, rotation: 2.4,  variant: 0 },

  // ── Grass tufts ────────────────────────────────────────────
  { id: 'g1',  type: 'grass', position: { x:  -2, z:  -6 }, scale: 1.0, rotation: 0.0, variant: 0 },
  { id: 'g2',  type: 'grass', position: { x:   6, z:  -1 }, scale: 1.0, rotation: 0.8, variant: 1 },
  { id: 'g3',  type: 'grass', position: { x:  -9, z:   1 }, scale: 1.0, rotation: 1.6, variant: 0 },
  { id: 'g4',  type: 'grass', position: { x:   2, z:  10 }, scale: 1.0, rotation: 2.4, variant: 1 },
  { id: 'g5',  type: 'grass', position: { x: -11, z:  11 }, scale: 1.0, rotation: 0.4, variant: 0 },
  { id: 'g6',  type: 'grass', position: { x:  13, z:  -1 }, scale: 1.0, rotation: 1.2, variant: 1 },
  { id: 'g7',  type: 'grass', position: { x:  -4, z:  -9 }, scale: 1.0, rotation: 2.0, variant: 0 },
  { id: 'g8',  type: 'grass', position: { x:   1, z:  -13 }, scale: 1.0, rotation: 0.6, variant: 1 },
  { id: 'g9',  type: 'grass', position: { x:  -13, z: -5 }, scale: 1.0, rotation: 1.4, variant: 0 },
  { id: 'g10', type: 'grass', position: { x:   5, z:   6 }, scale: 1.0, rotation: 2.2, variant: 1 },
  { id: 'g11', type: 'grass', position: { x:  -1, z:  12 }, scale: 1.0, rotation: 3.0, variant: 0 },
  { id: 'g12', type: 'grass', position: { x:  10, z:  13 }, scale: 1.0, rotation: 0.2, variant: 1 },

  // ── Pond ───────────────────────────────────────────────────────
  { id: 'pond1', type: 'pond', position: { x: -10, z: -10 }, scale: 1.2, rotation: 0.0, variant: 0 },

  // ── Extra trees (castle garden canopy) ─────────────────────────
  { id: 't4', type: 'tree', position: { x:  13, z: -12 }, scale: 1.05, rotation: 0.9, variant: 2 },
  { id: 't5', type: 'tree', position: { x:  -3, z:  14 }, scale: 0.85, rotation: 1.7, variant: 0 },

  // ── Stream-bank rocks (along z ≈ −12 to −14) ──────────────────
  { id: 'sr1', type: 'rock', position: { x:  -7, z: -12 }, scale: 0.45, rotation: 0.4, variant: 1 },
  { id: 'sr2', type: 'rock', position: { x:   2, z: -13 }, scale: 0.38, rotation: 2.0, variant: 0 },
  { id: 'sr3', type: 'rock', position: { x:   8, z: -12 }, scale: 0.50, rotation: 1.1, variant: 2 },
]
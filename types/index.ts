export type Direction = 'north' | 'south' | 'east' | 'west'
export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover'
export type FoodType = 'apple' | 'orange' | 'grape' | 'berry' | 'banana'
export type ObjectType = 'rock' | 'plant' | 'flower' | 'mushroom' | 'tree' | 'grass' | 'pond'

export interface Position {
  x: number
  z: number
}

export interface FoodItem {
  id: string
  position: Position
  type: FoodType
  points: number
}

export interface MapObject {
  id: string
  type: ObjectType
  position: Position
  scale: number
  rotation: number
  variant: number
}

export interface Level {
  size: number   // half-extent of the grid (grid = -size..size)
  speed: number  // ms per game tick
}

export interface ScoreEntry {
  name: string
  score: number
  round: number
  createdAt: string
}


// ── Obstacles — gameplay terrain the snake interacts with ────────────
//   pipe  — tunnel; enter only through its ends (sides are solid)
//   slope — raised ramp deck with side walls; cross only along its axis
//   hill  — smooth grassy mound; can be crossed from any direction
export type ObstacleType = 'pipe' | 'slope' | 'hill'

export interface Obstacle {
  id: string
  type: ObstacleType
  /** Centre cell */
  position: Position
  /** Travel axis for pipe / slope */
  axis: 'x' | 'z'
  /** Cells along the axis (pipe / slope, odd) */
  length: number
  /** Cells across the axis (slope, odd) */
  width: number
  /** Peak height in world units (slope deck / hill top) */
  height: number
  /** Hill radius in cells */
  radius: number
}

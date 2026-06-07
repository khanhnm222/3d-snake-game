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
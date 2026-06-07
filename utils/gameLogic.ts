import type { Direction, Position, FoodItem, FoodType } from '../types'

const DIR_VECTORS: Record<Direction, Position> = {
  north: { x:  0, z: -1 },
  south: { x:  0, z:  1 },
  east:  { x:  1, z:  0 },
  west:  { x: -1, z:  0 },
}

// Relative turns
const LEFT_OF: Record<Direction, Direction> = {
  north: 'west', west: 'south', south: 'east', east: 'north',
}
const RIGHT_OF: Record<Direction, Direction> = {
  north: 'east', east: 'south', south: 'west', west: 'north',
}

export function turnLeft(d: Direction): Direction  { return LEFT_OF[d] }
export function turnRight(d: Direction): Direction { return RIGHT_OF[d] }

export function dirVec(d: Direction): Position { return DIR_VECTORS[d] }

export function moveSnake(snake: Position[], direction: Direction, grow: boolean): Position[] {
  const v = DIR_VECTORS[direction]
  const newHead = { x: snake[0].x + v.x, z: snake[0].z + v.z }
  return grow ? [newHead, ...snake] : [newHead, ...snake.slice(0, -1)]
}

export function checkWallCollision(head: Position, size: number): boolean {
  return Math.abs(head.x) > size || Math.abs(head.z) > size
}

export function checkSelfCollision(snake: Position[]): boolean {
  const head = snake[0]
  return snake.slice(1).some(s => s.x === head.x && s.z === head.z)
}

export function checkFoodCollision(head: Position, food: FoodItem[]): FoodItem | null {
  return food.find(f => f.position.x === head.x && f.position.z === head.z) ?? null
}

const FOOD_TYPES: FoodType[] = ['apple', 'orange', 'grape', 'berry', 'banana']
const FOOD_POINTS: Record<FoodType, number> = {
  apple: 10, orange: 10, grape: 15, berry: 15, banana: 20,
}

export function spawnFood(
  occupied: Position[],
  size: number,
  id: string,
): FoodItem {
  let pos: Position
  do {
    pos = {
      x: Math.floor(Math.random() * (size * 2 - 2)) - (size - 1),
      z: Math.floor(Math.random() * (size * 2 - 2)) - (size - 1),
    }
  } while (occupied.some(o => o.x === pos.x && o.z === pos.z))

  const type = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)]
  return { id, position: pos, type, points: FOOD_POINTS[type] }
}

export function initialSnake(): Position[] {
  return [{ x: 0, z: 0 }, { x: 0, z: 1 }, { x: 0, z: 2 }]
}
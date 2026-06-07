'use client'
import { create } from 'zustand'
import type { Direction, FoodItem, FoodType, GameStatus, Position } from '../types'
import { SNAKE_THEMES } from '../lib/snackTheme'

export type SkyMode = 'auto' | 'day' | 'night'

export interface EatEvent {
  id: string
  x: number
  z: number
  type: FoodType
}
import {
  moveSnake, checkWallCollision, checkSelfCollision,
  checkFoodCollision, spawnFood, turnLeft, turnRight, initialSnake,
} from '../utils/gameLogic'
import { ROUND1_FOOD, ROUND1_LEVEL, ROUND1_OBJECTS } from '../configs/mapData'

interface GameStore {
  // ── state ──────────────────────────────────────────────────────
  snake: Position[]
  direction: Direction
  nextDirection: Direction
  food: FoodItem[]
  score: number
  highScore: number
  lives: number
  status: GameStatus
  round: number
  foodEaten: number
  eatEvents: EatEvent[]
  // ── settings ───────────────────────────────────────────────────
  snakeThemeIdx: number
  skyMode: SkyMode
  // ── actions ────────────────────────────────────────────────────
  setSnakeTheme: (idx: number) => void
  setSkyMode: (mode: SkyMode) => void
  dismissEatEvent: (id: string) => void
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  resetGame: () => void
  tick: () => void
  queueTurnLeft: () => void
  queueTurnRight: () => void
  queueDirection: (d: Direction) => void
}

let foodCounter = 100

export const useGameStore = create<GameStore>((set, get) => ({
  snake: initialSnake(),
  direction: 'north',
  nextDirection: 'north',
  food: [...ROUND1_FOOD],
  score: 0,
  highScore: 0,
  lives: 3,
  status: 'idle',
  round: 1,
  foodEaten: 0,
  eatEvents: [],
  snakeThemeIdx: 0,
  skyMode: 'auto',

  setSnakeTheme: (idx: number) => set({ snakeThemeIdx: Math.max(0, Math.min(idx, SNAKE_THEMES.length - 1)) }),
  setSkyMode: (mode: SkyMode) => set({ skyMode: mode }),

  dismissEatEvent: (id: string) => set(s => ({ eatEvents: s.eatEvents.filter(e => e.id !== id) })),

  startGame: () => set({
    snake: initialSnake(),
    direction: 'north',
    nextDirection: 'north',
    food: [...ROUND1_FOOD],
    score: 0,
    lives: 3,
    status: 'playing',
    round: 1,
    foodEaten: 0,
    eatEvents: [],
  }),

  pauseGame: () => {
    if (get().status === 'playing') set({ status: 'paused' })
  },

  resumeGame: () => {
    if (get().status === 'paused') set({ status: 'playing' })
  },

  resetGame: () => set({
    snake: initialSnake(),
    direction: 'north',
    nextDirection: 'north',
    food: [...ROUND1_FOOD],
    score: 0,
    lives: 3,
    status: 'idle',
    round: 1,
    foodEaten: 0,
    eatEvents: [],
  }),

  tick: () => {
    const { snake, nextDirection, food, score, lives, highScore, foodEaten, eatEvents } = get()
    const dir = nextDirection

    const newSnake = moveSnake(snake, dir, false)
    const head = newSnake[0]

    // Wall or self collision
    if (checkWallCollision(head, ROUND1_LEVEL.size) || checkSelfCollision(newSnake)) {
      const newLives = lives - 1
      if (newLives <= 0) {
        set({ status: 'gameover', highScore: Math.max(score, highScore) })
      } else {
        set({
          lives: newLives,
          snake: initialSnake(),
          direction: 'north',
          nextDirection: 'north',
        })
      }
      return
    }

    // Food collision
    const eaten = checkFoodCollision(head, food)
    if (eaten) {
      const grownSnake = moveSnake(snake, dir, true)
      const remaining = food.filter(f => f.id !== eaten.id)
      const newFood: FoodItem[] = [
        ...remaining,
        spawnFood(
          [...grownSnake.map(s => s), ...remaining.map(f => f.position)],
          ROUND1_LEVEL.size,
          `f${++foodCounter}`,
        ),
      ]
      const newScore = score + eaten.points
      const newEatEvent: EatEvent = {
        id: `eat_${++foodCounter}`,
        x: eaten.position.x,
        z: eaten.position.z,
        type: eaten.type,
      }
      set({
        snake: grownSnake,
        direction: dir,
        food: newFood,
        score: newScore,
        highScore: Math.max(newScore, highScore),
        foodEaten: foodEaten + 1,
        eatEvents: [...eatEvents, newEatEvent],
      })
    } else {
      set({ snake: newSnake, direction: dir })
    }
  },

  queueTurnLeft:  () => set(s => ({ nextDirection: turnLeft(s.direction) })),
  queueTurnRight: () => set(s => ({ nextDirection: turnRight(s.direction) })),

  queueDirection: (d: Direction) => {
    const { direction } = get()
    // Prevent 180° reversal
    const opposites: Record<Direction, Direction> = {
      north: 'south', south: 'north', east: 'west', west: 'east',
    }
    if (opposites[direction] !== d) set({ nextDirection: d })
  },
}))

export { ROUND1_OBJECTS, ROUND1_LEVEL }
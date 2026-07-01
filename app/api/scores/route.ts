import { NextRequest, NextResponse } from 'next/server'

interface ScoreEntry {
  name:      string
  score:     number
  round:     number
  createdAt: string
}

// Module-level in-memory store (persists across hot-reloads in dev,
// resets on server restart — swap for a DB when you need persistence).
const scores: ScoreEntry[] = []

export async function GET() {
  const top20 = [...scores].slice(0, 20)
  return NextResponse.json(top20)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  if (!body || typeof body.name !== 'string' || typeof body.score !== 'number') {
    return NextResponse.json({ error: 'name and score are required' }, { status: 400 })
  }

  const entry: ScoreEntry = {
    name:      body.name.trim().slice(0, 20),
    score:     Math.max(0, body.score),
    round:     typeof body.round === 'number' ? body.round : 1,
    createdAt: new Date().toISOString(),
  }

  scores.push(entry)
  scores.sort((a, b) => b.score - a.score)
  if (scores.length > 100) scores.length = 100

  return NextResponse.json(entry, { status: 201 })
}
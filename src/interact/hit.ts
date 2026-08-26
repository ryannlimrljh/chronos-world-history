import type { LayoutResult, PositionedRect } from '../types'

/**
 * Spatial hit testing. Rects are bucketed once per layout into a coarse
 * world-space grid, so a mousemove costs a handful of lookups instead of a
 * scan over every rect. Nested children win over their parents (deepest
 * depth first) since they render on top.
 */

const CELL = 128

export interface HitIndex {
  test(worldX: number, worldY: number): PositionedRect | null
}

export function buildHitIndex(layout: LayoutResult): HitIndex {
  // Shapes are stepped, so bucket and test each run, not the bounding box.
  const grid = new Map<string, { rect: PositionedRect; runIdx: number }[]>()
  const key = (cx: number, cy: number) => `${cx}:${cy}`
  for (const rect of layout.rects) {
    rect.runs.forEach((run, runIdx) => {
      const x0 = Math.floor(run.x0 / CELL)
      const x1 = Math.floor(run.x1 / CELL)
      const y0 = Math.floor(run.y0 / CELL)
      const y1 = Math.floor(run.y1 / CELL)
      for (let cx = x0; cx <= x1; cx++) {
        for (let cy = y0; cy <= y1; cy++) {
          const k = key(cx, cy)
          const bucket = grid.get(k)
          const entry = { rect, runIdx }
          if (bucket) bucket.push(entry)
          else grid.set(k, [entry])
        }
      }
    })
  }
  return {
    test(worldX, worldY) {
      const bucket = grid.get(
        key(Math.floor(worldX / CELL), Math.floor(worldY / CELL)),
      )
      if (!bucket) return null
      let best: PositionedRect | null = null
      for (const { rect, runIdx } of bucket) {
        const run = rect.runs[runIdx]!
        if (
          worldX >= run.x0 &&
          worldX <= run.x1 &&
          worldY >= run.y0 &&
          worldY <= run.y1
        ) {
          if (!best || rect.depth > best.depth) best = rect
        }
      }
      return best
    },
  }
}

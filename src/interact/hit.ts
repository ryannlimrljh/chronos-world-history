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
  const grid = new Map<string, PositionedRect[]>()
  const key = (cx: number, cy: number) => `${cx}:${cy}`
  for (const rect of layout.rects) {
    const x0 = Math.floor(rect.x / CELL)
    const x1 = Math.floor((rect.x + rect.width) / CELL)
    const y0 = Math.floor(rect.y / CELL)
    const y1 = Math.floor((rect.y + rect.height) / CELL)
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const k = key(cx, cy)
        const bucket = grid.get(k)
        if (bucket) bucket.push(rect)
        else grid.set(k, [rect])
      }
    }
  }
  return {
    test(worldX, worldY) {
      const bucket = grid.get(key(Math.floor(worldX / CELL), Math.floor(worldY / CELL)))
      if (!bucket) return null
      let best: PositionedRect | null = null
      for (const r of bucket) {
        if (
          worldX >= r.x &&
          worldX <= r.x + r.width &&
          worldY >= r.y &&
          worldY <= r.y + r.height
        ) {
          if (!best || r.depth > best.depth) best = r
        }
      }
      return best
    },
  }
}

import type { LayoutResult, PositionedRect } from '../types'
import { getRegion } from '../config/regions'
import { strokeFor } from '../config/color'
import type { Camera } from '../store/view'

/**
 * Pure canvas painting. No React in here: given a context, a layout and a
 * camera, draw the mosaic. Called from a rAF loop, so it must be cheap —
 * fills and strokes are precomputed per rect the first time and cached.
 */

export interface PaintStyle {
  fill: string
  stroke: string
}

const styleCache = new Map<string, PaintStyle>()

export function styleFor(rect: PositionedRect): PaintStyle {
  // Alternate tints down each sub-column chain so adjacent same-lane blocks
  // stay distinguishable but related. Deterministic: derived from position.
  const region = getRegion(rect.region)
  const tintIndex =
    (Math.abs(Math.round(rect.x * 7 + rect.y * 13)) + rect.depth) %
    region.tints.length
  const key = `${rect.region}:${tintIndex}`
  let style = styleCache.get(key)
  if (!style) {
    const fill = region.tints[tintIndex]!
    style = { fill, stroke: strokeFor(fill) }
    styleCache.set(key, style)
  }
  return style
}

export function paintMosaic(
  ctx: CanvasRenderingContext2D,
  layout: LayoutResult,
  camera: Camera,
  viewportW: number,
  viewportH: number,
): void {
  const { k, tx, ty } = camera
  ctx.clearRect(0, 0, viewportW, viewportH)
  ctx.lineWidth = 1

  for (const rect of layout.rects) {
    const x = rect.x * k + tx
    const y = rect.y * k + ty
    const w = rect.width * k
    const h = rect.height * k
    // Cull everything off-screen.
    if (x + w < 0 || y + h < 0 || x > viewportW || y > viewportH) continue
    const { fill, stroke } = styleFor(rect)
    ctx.fillStyle = fill
    // Crisp hairlines: snap to half-pixel grid.
    const sx = Math.round(x) + 0.5
    const sy = Math.round(y) + 0.5
    const sw = Math.max(Math.round(w) - 1, 1)
    const sh = Math.max(Math.round(h) - 1, 1)
    ctx.fillRect(sx, sy, sw, sh)
    ctx.strokeStyle = stroke
    ctx.strokeRect(sx, sy, sw, sh)
  }
}

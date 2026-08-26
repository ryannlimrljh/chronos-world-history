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

export interface PaintState {
  /** Rects whose polity fails the active filters or time cursor. */
  dimmedIds: ReadonlySet<string>
  selectedId: string | null
  compareIds: readonly string[]
}

const NO_STATE: PaintState = { dimmedIds: new Set(), selectedId: null, compareIds: [] }

export function paintMosaic(
  ctx: CanvasRenderingContext2D,
  layout: LayoutResult,
  camera: Camera,
  viewportW: number,
  viewportH: number,
  state: PaintState = NO_STATE,
): void {
  const { k, tx, ty } = camera
  ctx.clearRect(0, 0, viewportW, viewportH)
  ctx.lineWidth = 1

  // Dimmed rects first, then live ones, then highlight rings, so dimming
  // never washes out a live rect drawn beside it.
  for (const pass of [true, false] as const) {
    ctx.globalAlpha = pass ? 0.15 : 1
    for (const rect of layout.rects) {
      if (state.dimmedIds.has(rect.polityId) !== pass) continue
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
  ctx.globalAlpha = 1

  // Selection and compare outlines: ink rings floating over the artefact.
  const ringed = new Set(state.compareIds)
  if (state.selectedId) ringed.add(state.selectedId)
  if (ringed.size > 0) {
    ctx.lineWidth = 2
    ctx.strokeStyle = '#1A1614'
    for (const rect of layout.rects) {
      if (!ringed.has(rect.polityId)) continue
      const x = rect.x * k + tx
      const y = rect.y * k + ty
      const w = rect.width * k
      const h = rect.height * k
      if (x + w < 0 || y + h < 0 || x > viewportW || y > viewportH) continue
      ctx.strokeRect(Math.round(x) - 1.5, Math.round(y) - 1.5, w + 3, h + 3)
    }
    ctx.lineWidth = 1
  }
}

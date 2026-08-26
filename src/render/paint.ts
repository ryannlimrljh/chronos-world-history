import type { LayoutResult, PositionedRect, Run } from '../types'
import { getRegion } from '../config/regions'
import { strokeFor } from '../config/color'
import type { Camera } from '../store/view'

/**
 * Pure canvas painting. No React in here: given a context, a layout and a
 * camera, draw the mosaic. Shapes are stepped outlines (Histomap-style);
 * each is filled and stroked as ONE path so hairlines trace only the true
 * border, never internal step seams.
 */

export interface PaintStyle {
  fill: string
  stroke: string
}

const styleCache = new Map<string, PaintStyle>()

export function styleFor(rect: PositionedRect): PaintStyle {
  // Alternate tints so adjacent same-lane blocks stay distinguishable but
  // related. Deterministic: derived from position.
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

function tracePath(
  ctx: CanvasRenderingContext2D,
  runs: Run[],
  k: number,
  tx: number,
  ty: number,
): void {
  const sx = (v: number) => Math.round(v * k + tx) + 0.5
  const sy = (v: number) => Math.round(v * k + ty) + 0.5
  ctx.beginPath()
  // Down the left edge with jogs, then up the right edge.
  ctx.moveTo(sx(runs[0]!.x0), sy(runs[0]!.y0))
  for (const r of runs) {
    ctx.lineTo(sx(r.x0), sy(r.y0))
    ctx.lineTo(sx(r.x0), sy(r.y1))
  }
  for (let i = runs.length - 1; i >= 0; i--) {
    const r = runs[i]!
    ctx.lineTo(sx(r.x1), sy(r.y1))
    ctx.lineTo(sx(r.x1), sy(r.y0))
  }
  ctx.closePath()
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

  // Dimmed shapes first, then live ones, so dimming never washes out a
  // live shape drawn beside it.
  for (const pass of [true, false] as const) {
    ctx.globalAlpha = pass ? 0.15 : 1
    for (const rect of layout.rects) {
      if (state.dimmedIds.has(rect.polityId) !== pass) continue
      const x = rect.x * k + tx
      const y = rect.y * k + ty
      const w = rect.width * k
      const h = rect.height * k
      if (x + w < 0 || y + h < 0 || x > viewportW || y > viewportH) continue
      const { fill, stroke } = styleFor(rect)
      tracePath(ctx, rect.runs, k, tx, ty)
      ctx.fillStyle = fill
      ctx.fill()
      ctx.strokeStyle = stroke
      ctx.stroke()
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
      tracePath(ctx, rect.runs, k, tx, ty)
      ctx.stroke()
    }
    ctx.lineWidth = 1
  }
}

import { describe, expect, it } from 'vitest'
import type { LayoutConfig, PositionedRect } from '../types'
import { REGION_ORDER } from '../config/regions'
import { loadFixture } from '../data/fixture'
import { layout } from './engine'
import { DEFAULT_SCALE } from './scale'

const CONFIG: LayoutConfig = {
  scale: DEFAULT_SCALE,
  width: 800,
  sliceYears: 25,
  gap: 0,
  nestInset: 3,
  minRectWidth: 6,
  anchorStrength: 0.85,
  titleReserve: { untilYear: -950, width: 340 },
}

const fixture = loadFixture()
const result = layout(fixture, CONFIG)
const byId = new Map(result.rects.map((r) => [r.polityId, r]))
const polityById = new Map(fixture.map((p) => [p.id, p]))

/** Sample the shape's horizontal extent at a given world y, if alive. */
function extentAt(rect: PositionedRect, y: number): [number, number] | null {
  for (const run of rect.runs) {
    if (y >= run.y0 && y < run.y1) return [run.x0, run.x1]
  }
  return null
}

describe('layout engine (histomap tiling)', () => {
  it('positions every polity exactly once with at least one run', () => {
    expect(result.rects).toHaveLength(fixture.length)
    for (const r of result.rects) expect(r.runs.length).toBeGreaterThan(0)
  })

  it('no two top-level shapes overlap at any sampled moment', () => {
    const top = result.rects.filter((r) => r.depth === 0)
    for (let y = 0; y < result.height; y += 7) {
      const alive = top
        .map((r) => ({ r, ext: extentAt(r, y) }))
        .filter((e) => e.ext !== null)
      for (const a of alive) {
        for (const b of alive) {
          if (a === b) continue
          const [ax0, ax1] = a.ext!
          const [bx0, bx1] = b.ext!
          expect(
            ax0 < bx1 - 0.01 && bx0 < ax1 - 0.01,
            `${a.r.polityId} overlaps ${b.r.polityId} at y=${y}`,
          ).toBe(false)
        }
      }
    }
  })

  it('THE HOLE TEST: every slice row tiles with zero internal gaps', () => {
    const top = result.rects.filter((r) => r.depth === 0)
    for (let y = 4; y < result.height; y += 13) {
      const extents = top
        .map((r) => extentAt(r, y))
        .filter((e): e is [number, number] => e !== null)
        .sort((a, b) => a[0] - b[0])
      for (let i = 1; i < extents.length; i++) {
        const gap = extents[i]![0] - extents[i - 1]![1]
        expect(
          gap,
          `hole of ${gap.toFixed(1)}px at y=${y.toFixed(0)}`,
        ).toBeLessThan(0.01)
      }
    }
  })

  it('western contemporaries stay west of eastern ones', () => {
    const top = result.rects.filter((r) => r.depth === 0)
    for (let y = 0; y < result.height; y += 11) {
      const alive = top
        .map((r) => ({ r, ext: extentAt(r, y) }))
        .filter((e) => e.ext !== null)
      for (const a of alive) {
        for (const b of alive) {
          const la = REGION_ORDER.indexOf(a.r.region)
          const lb = REGION_ORDER.indexOf(b.r.region)
          if (la >= lb) continue
          expect(
            a.ext![1],
            `${a.r.polityId} east of ${b.r.polityId} at y=${y}`,
          ).toBeLessThanOrEqual(b.ext![0] + 0.01)
        }
      }
    }
  })

  it('nested children stay inside their parent at every moment', () => {
    for (const rect of result.rects) {
      const polity = polityById.get(rect.polityId)!
      if (!polity.parent) continue
      const parentPolity = polityById.get(polity.parent)!
      if (polity.start >= parentPolity.end) continue
      const parent = byId.get(polity.parent)!
      for (const run of rect.runs) {
        const mid = (run.y0 + run.y1) / 2
        const parentExt = extentAt(parent, mid)
        expect(parentExt, `${rect.polityId} outside parent at y=${mid}`).not.toBeNull()
        expect(run.x0).toBeGreaterThanOrEqual(parentExt![0] - 0.01)
        expect(run.x1).toBeLessThanOrEqual(parentExt![1] + 0.01)
      }
    }
  })

  it('respects the title reserve', () => {
    for (const r of result.rects) {
      const p = polityById.get(r.polityId)!
      if (p.start >= -950) continue
      const reserveBottom = CONFIG.scale.yearToY(-950)
      for (const run of r.runs) {
        if (run.y0 < reserveBottom) {
          expect(run.x0, `${r.polityId} intrudes on title zone`).toBeGreaterThanOrEqual(340)
        }
      }
    }
  })

  it('significance drives slot width among contemporaries', () => {
    // Bounding boxes include horizontal drift as neighbours change, so
    // compare the actual slot (run) widths.
    const slotWidth = (r: PositionedRect) =>
      Math.max(...r.runs.map((run) => run.x1 - run.x0))
    const rome = byId.get('roman-empire')!
    const wessex = byId.get('wessex')!
    expect(slotWidth(rome)).toBeGreaterThan(slotWidth(wessex) * 2)
  })

  it('is deterministic', () => {
    const again = layout(loadFixture(), CONFIG)
    expect(again).toEqual(result)
  })

  it('matches the stable fixture snapshot', () => {
    const rounded = result.rects.map((r) => ({
      id: r.polityId,
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      steps: r.runs.length,
      d: r.depth,
    }))
    expect(rounded).toMatchSnapshot()
  })
})

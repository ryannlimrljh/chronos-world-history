import { describe, expect, it } from 'vitest'
import type { LayoutConfig, PositionedRect } from '../types'
import { REGION_ORDER } from '../config/regions'
import { loadFixture } from '../data/fixture'
import { layout } from './engine'
import { DEFAULT_SCALE } from './scale'

const CONFIG: LayoutConfig = {
  scale: DEFAULT_SCALE,
  width: 1200,
  sliceYears: 25,
  gap: 0,
  nestInset: 3,
  minRectWidth: 8,
  anchorStrength: 0.85,
}

const fixture = loadFixture()
const result = layout(fixture, CONFIG)
const byId = new Map(result.rects.map((r) => [r.polityId, r]))
const polityById = new Map(fixture.map((p) => [p.id, p]))

const timeOverlap = (a: PositionedRect, b: PositionedRect): boolean =>
  a.y < b.y + b.height && b.y < a.y + a.height

const xOverlap = (a: PositionedRect, b: PositionedRect): boolean =>
  a.x < b.x + b.width - 0.001 && b.x < a.x + a.width - 0.001

describe('layout engine', () => {
  it('positions every polity exactly once', () => {
    expect(result.rects).toHaveLength(fixture.length)
    expect(new Set(result.rects.map((r) => r.polityId)).size).toBe(
      fixture.length,
    )
  })

  it('no two top-level contemporaries overlap in space', () => {
    const top = result.rects.filter((r) => r.depth === 0)
    for (const a of top) {
      for (const b of top) {
        if (a === b) continue
        expect(
          timeOverlap(a, b) && xOverlap(a, b),
          `${a.polityId} collides with ${b.polityId}`,
        ).toBe(false)
      }
    }
  })

  it('western contemporaries sit fully west of eastern ones', () => {
    const top = result.rects.filter((r) => r.depth === 0)
    for (const a of top) {
      for (const b of top) {
        const la = REGION_ORDER.indexOf(a.region)
        const lb = REGION_ORDER.indexOf(b.region)
        if (la >= lb || !timeOverlap(a, b)) continue
        expect(
          a.x + a.width,
          `${a.polityId} (west) should clear ${b.polityId} (east)`,
        ).toBeLessThanOrEqual(b.x + 0.001)
      }
    }
  })

  it('temporally nested children stay horizontally inside their parent', () => {
    for (const rect of result.rects) {
      const polity = polityById.get(rect.polityId)!
      if (!polity.parent) continue
      const parentPolity = polityById.get(polity.parent)!
      if (polity.start >= parentPolity.end) continue // continuation child
      const parent = byId.get(polity.parent)!
      expect(rect.depth).toBe(parent.depth + 1)
      expect(rect.x).toBeGreaterThanOrEqual(parent.x)
      expect(rect.x + rect.width).toBeLessThanOrEqual(
        parent.x + parent.width + 0.001,
      )
    }
  })

  it('continuation children carry on below the parent, connected to it', () => {
    // West Rome and Byzantium begin at Rome's end. They should sit directly
    // below Rome's footprint, at least one of them x-aligned with it.
    const rome = byId.get('roman-empire')!
    const west = byId.get('western-roman-empire')!
    const east = byId.get('byzantine-empire')!
    expect(west.depth).toBe(0)
    expect(east.depth).toBe(0)
    expect(west.y).toBeCloseTo(rome.y + rome.height, 0)
    expect(east.y).toBeCloseTo(rome.y + rome.height, 0)
    // The western continuation inherits the parent's column x.
    expect(west.x).toBeCloseTo(rome.x, 0)
  })

  it('sibling children never overlap each other', () => {
    const west = byId.get('western-roman-empire')!
    const east = byId.get('byzantine-empire')!
    expect(timeOverlap(west, east) && xOverlap(west, east)).toBe(false)
  })

  it('a successor can share its predecessor column (touching is not colliding)', () => {
    const republic = byId.get('roman-republic')!
    const empire = byId.get('roman-empire')!
    // Republic ends -27, Empire starts -27: stacked vertically is legal.
    expect(republic.y + republic.height).toBeCloseTo(empire.y, 0)
  })

  it('significance drives relative width among contemporaries', () => {
    const rome = byId.get('roman-empire')!
    const wessex = byId.get('wessex')!
    expect(rome.width).toBeGreaterThan(wessex.width * 1.5)
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
      d: r.depth,
    }))
    expect(rounded).toMatchSnapshot()
  })
})

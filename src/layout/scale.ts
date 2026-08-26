import type { TimeScale, Year } from '../types'
import { CURRENT_YEAR } from '../types'

/**
 * Time scales. The vertical ruler of the whole poster.
 *
 * History is not evenly interesting: 3000 BCE to 2000 BCE contains a handful
 * of states, 1500 CE to now contains hundreds. A linear scale would leave the
 * ancient world a thin smear and the modern world an unreadable crush. The
 * piecewise scale gives each stretch of history its own pixels-per-year rate.
 *
 * All scales satisfy the same TimeScale contract, so the engine and renderer
 * never know which one they are using.
 */

export interface ScaleSegment {
  /** Year this segment begins at. */
  from: Year
  /** How many vertical pixels one year occupies within this segment. */
  pxPerYear: number
}

export function makePiecewiseScale(
  segments: readonly ScaleSegment[],
  maxYear: Year,
): TimeScale {
  if (segments.length === 0) throw new Error('Need at least one segment')
  for (let i = 1; i < segments.length; i++) {
    if (segments[i]!.from <= segments[i - 1]!.from) {
      throw new Error('Segment breakpoints must be strictly ascending')
    }
  }
  for (const s of segments) {
    if (s.pxPerYear <= 0) throw new Error('pxPerYear must be positive')
  }

  const minYear = segments[0]!.from
  // Cumulative pixel offset at the start of each segment.
  const offsets: number[] = [0]
  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1]!
    offsets.push(
      offsets[i - 1]! + (segments[i]!.from - prev.from) * prev.pxPerYear,
    )
  }
  const last = segments[segments.length - 1]!
  const height =
    offsets[offsets.length - 1]! + (maxYear - last.from) * last.pxPerYear

  function segmentIndexFor(year: Year): number {
    let i = segments.length - 1
    while (i > 0 && year < segments[i]!.from) i--
    return i
  }

  return {
    id: 'piecewise',
    minYear,
    maxYear,
    height,
    yearToY(year: Year): number {
      const clamped = Math.min(Math.max(year, minYear), maxYear)
      const i = segmentIndexFor(clamped)
      const seg = segments[i]!
      return offsets[i]! + (clamped - seg.from) * seg.pxPerYear
    },
    yToYear(y: number): Year {
      const clamped = Math.min(Math.max(y, 0), height)
      let i = segments.length - 1
      while (i > 0 && clamped < offsets[i]!) i--
      const seg = segments[i]!
      return seg.from + (clamped - offsets[i]!) / seg.pxPerYear
    },
  }
}

export function makeLinearScale(
  minYear: Year,
  maxYear: Year,
  pxPerYear: number,
): TimeScale {
  return makePiecewiseScale([{ from: minYear, pxPerYear }], maxYear)
}

/**
 * The default poster scale: ancient millennia compressed, the classical and
 * medieval world at a middle rate, 1500 CE onward expanded.
 */
export const DEFAULT_SCALE: TimeScale = makePiecewiseScale(
  [
    { from: -4000, pxPerYear: 0.07 },
    { from: -1000, pxPerYear: 0.2 },
    { from: 1500, pxPerYear: 0.6 },
  ],
  CURRENT_YEAR,
)

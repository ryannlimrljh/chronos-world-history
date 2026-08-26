import { describe, expect, it } from 'vitest'
import { DEFAULT_SCALE, makeLinearScale, makePiecewiseScale } from './scale'

describe('time scale', () => {
  it('is monotonic across the full span', () => {
    let prev = -Infinity
    for (let year = -4000; year <= 2026; year += 7) {
      const y = DEFAULT_SCALE.yearToY(year)
      expect(y).toBeGreaterThan(prev)
      prev = y
    }
  })

  it('round-trips within one pixel', () => {
    for (let y = 0; y <= DEFAULT_SCALE.height; y += 3.7) {
      const year = DEFAULT_SCALE.yToYear(y)
      expect(Math.abs(DEFAULT_SCALE.yearToY(year) - y)).toBeLessThan(1)
    }
    for (let year = -4000; year <= 2026; year += 11) {
      const y = DEFAULT_SCALE.yearToY(year)
      const back = DEFAULT_SCALE.yToYear(y)
      // A pixel at the coarsest rate (0.07 px/yr) spans ~14 years.
      expect(Math.abs(back - year)).toBeLessThan(1 / 0.07)
    }
  })

  it('compresses ancient time relative to modern time', () => {
    const ancientCentury =
      DEFAULT_SCALE.yearToY(-2900) - DEFAULT_SCALE.yearToY(-3000)
    const modernCentury =
      DEFAULT_SCALE.yearToY(1900) - DEFAULT_SCALE.yearToY(1800)
    expect(modernCentury).toBeGreaterThan(ancientCentury * 4)
  })

  it('clamps out-of-range input instead of extrapolating', () => {
    expect(DEFAULT_SCALE.yearToY(-9999)).toBe(0)
    expect(DEFAULT_SCALE.yearToY(9999)).toBe(DEFAULT_SCALE.height)
  })

  it('supports a plain linear scale through the same interface', () => {
    const linear = makeLinearScale(-4000, 2026, 0.2)
    expect(linear.yearToY(-4000)).toBe(0)
    expect(linear.yearToY(2026)).toBeCloseTo(6026 * 0.2)
  })

  it('rejects malformed segment lists', () => {
    expect(() => makePiecewiseScale([], 2026)).toThrow()
    expect(() =>
      makePiecewiseScale(
        [
          { from: 0, pxPerYear: 1 },
          { from: -100, pxPerYear: 1 },
        ],
        2026,
      ),
    ).toThrow()
    expect(() => makePiecewiseScale([{ from: 0, pxPerYear: 0 }], 2026)).toThrow()
  })
})

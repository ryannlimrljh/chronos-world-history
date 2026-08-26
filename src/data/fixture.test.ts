import { describe, expect, it } from 'vitest'
import { loadFixture } from './fixture'
import { REGIONS } from '../config/regions'
import { ERAS } from '../config/eras'
import { contrastRatio, labelColorOn } from '../config/color'

describe('phase 0 wiring', () => {
  it('loads all 20 fixture polities with valid references', () => {
    const polities = loadFixture()
    expect(polities).toHaveLength(20)
  })

  it('covers the nesting stress case', () => {
    const polities = loadFixture()
    const nested = polities.filter((p) => p.parent)
    expect(nested.map((p) => p.id).sort()).toEqual([
      'byzantine-empire',
      'western-roman-empire',
    ])
  })

  it('defines 14 lanes in fixed order and 9 eras', () => {
    expect(REGIONS).toHaveLength(14)
    expect(REGIONS.map((r) => r.order)).toEqual([...REGIONS.keys()])
    expect(ERAS).toHaveLength(9)
  })

  it('every lane tint yields a readable label colour', () => {
    for (const region of REGIONS) {
      for (const tint of region.tints) {
        const label = labelColorOn(tint)
        expect(contrastRatio(label, tint)).toBeGreaterThan(3)
      }
    }
  })
})

import { describe, expect, it } from 'vitest'
import type { LayoutConfig } from '../types'
import { layout } from '../layout/engine'
import { DEFAULT_SCALE } from '../layout/scale'
import { loadPolities } from '../data/polities'
import { EMPTY_FILTERS } from '../store/app'
import { buildPosterSvg } from './svg'

const CONFIG: LayoutConfig = {
  scale: DEFAULT_SCALE,
  width: 1250,
  sliceYears: 25,
  gap: 0,
  nestInset: 3,
  minRectWidth: 6,
  anchorStrength: 0.85,
  titleReserve: { untilYear: -950, width: 340 },
}

const polities = loadPolities()
const result = layout(polities, CONFIG)
const map = new Map(polities.map((p) => [p.id, p]))

function build(lang: 'en' | 'zh') {
  return buildPosterSvg({
    layout: result,
    polities: map,
    scale: DEFAULT_SCALE,
    filters: EMPTY_FILTERS,
    lang,
  })
}

describe('poster SVG export', () => {
  it('emits a well-formed A1 sheet', () => {
    const svg = build('en')
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.trimEnd().endsWith('</svg>')).toBe(true)
    expect(svg).toContain('width="594mm"')
    expect(svg).toContain('height="841mm"')
    // Balanced tags: every element opened is closed.
    const opens = (svg.match(/<(path|text|rect|line)\b/g) ?? []).length
    const closes =
      (svg.match(/<\/(text)>/g) ?? []).length +
      (svg.match(/\/>/g) ?? []).length
    expect(closes).toBeGreaterThanOrEqual(opens - 1)
  })

  it('draws every polity and escapes markup characters', () => {
    const svg = build('en')
    const paths = (svg.match(/<path /g) ?? []).length
    expect(paths).toBe(result.rects.length)
    // No raw angle brackets inside text nodes.
    for (const m of svg.matchAll(/<text[^>]*>([^<]*)</g)) {
      expect(m[1]).not.toMatch(/[<>]/)
    }
  })

  it('honours the active language', () => {
    expect(build('zh')).toContain('清朝')
    expect(build('en')).toContain('Qing Dynasty')
  })

  it('dims filtered-out polities instead of dropping them', () => {
    const svg = buildPosterSvg({
      layout: result,
      polities: map,
      scale: DEFAULT_SCALE,
      filters: { ...EMPTY_FILTERS, minSignificance: 5 },
      lang: 'en',
    })
    expect((svg.match(/<path /g) ?? []).length).toBe(result.rects.length)
    expect(svg).toContain('opacity="0.15"')
  })
})

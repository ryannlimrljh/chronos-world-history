/**
 * Colour maths for the mosaic.
 *
 * The brief asks for flat, chalky, screen-printed fills and for label
 * contrast to be computed rather than hardcoded. Both live here so the
 * rest of the app never touches a raw hex.
 */

export const PAPER = '#FAF0EC'
export const INK = '#1A1614'

interface Rgb {
  r: number
  g: number
  b: number
}

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const c = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

/** Linear blend. `t` of 0 returns `a`, 1 returns `b`. */
export function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a)
  const y = hexToRgb(b)
  return rgbToHex({
    r: x.r + (y.r - x.r) * t,
    g: x.g + (y.g - x.g) * t,
    b: x.b + (y.b - x.b) * t,
  })
}

/**
 * Mixing toward the paper rather than toward pure white is what keeps the
 * palette chalky. White tints go pastel and read as digital.
 */
export const lighten = (hex: string, t: number): string => mix(hex, PAPER, t)
export const darken = (hex: string, t: number): string => mix(hex, INK, t)

/** The 1px hairline stroke every rectangle carries: its own fill, 25% darker. */
export const strokeFor = (fill: string): string => darken(fill, 0.25)

/**
 * Four tints per family, light to dark. Adjacent rectangles in the same lane
 * alternate through these so they stay distinguishable but obviously related.
 */
export function deriveTints(base: string): readonly string[] {
  return [lighten(base, 0.38), lighten(base, 0.18), base, darken(base, 0.18)]
}

/** Relative luminance, per WCAG. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** Near-black on light fills, pure white on the darker reds and blues. */
export function labelColorOn(fill: string): string {
  return contrastRatio(INK, fill) >= contrastRatio('#FFFFFF', fill)
    ? INK
    : '#FFFFFF'
}

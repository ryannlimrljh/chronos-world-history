import type { Polity, Precision, Year } from '../types'
import { CURRENT_YEAR } from '../types'

/** Format a year for humans: 509 BCE, 1453, or "present". */
export function formatYear(year: Year, precision?: Precision): string {
  const prefix =
    precision === 'circa' || precision === 'century'
      ? 'c. '
      : precision === 'disputed'
        ? '?'
        : ''
  if (year >= CURRENT_YEAR) return 'present'
  if (year < 0) return `${prefix}${-year} BCE`
  return `${prefix}${year} CE`
}

export function formatRange(p: Polity): string {
  return `${formatYear(p.start, p.startPrecision)} – ${formatYear(p.end, p.endPrecision)}`
}

/** Historical duration: there is no year zero, so a span crossing it is one year shorter. */
export function durationYears(p: Polity): number {
  const crossesZero = p.start < 0 && p.end > 0
  return p.end - p.start - (crossesZero ? 1 : 0)
}

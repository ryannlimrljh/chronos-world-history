import type { Polity, Year } from '../types'
import { ERAS } from '../config/eras'
import type { FilterState } from '../store/app'

const EMPTY: ReadonlySet<string> = new Set()

/**
 * The single dimming rule shared by canvas, labels and exports.
 * A polity is dimmed when it fails any active filter, or when the time
 * cursor is set and the polity was not alive at that year.
 */
export function isDimmed(
  p: Polity,
  filters: FilterState,
  timeCursor: Year | null,
  spotlightIds: ReadonlySet<string> = EMPTY,
): boolean {
  // A tour spotlight overrides everything: only its cast stays lit.
  if (spotlightIds.size > 0) return !spotlightIds.has(p.id)
  if (filters.regions.size > 0 && !filters.regions.has(p.region)) return true
  if (filters.categories.size > 0 && !filters.categories.has(p.category)) {
    return true
  }
  if (filters.eras.size > 0) {
    const overlapsEra = ERAS.some(
      (e) => filters.eras.has(e.id) && p.start < e.end && p.end > e.start,
    )
    if (!overlapsEra) return true
  }
  if (p.significance < filters.minSignificance) return true
  if (timeCursor !== null && (p.start > timeCursor || p.end < timeCursor)) {
    return true
  }
  return false
}

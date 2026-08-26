import type { Era } from '../types'
import { CURRENT_YEAR } from '../types'

/**
 * The nine era brackets that run down the left gutter. Boundaries are
 * conventional round numbers, not scholarly claims; they exist to orient
 * the eye, not to date anything.
 */
export const ERAS: readonly Era[] = [
  { id: 'neolithic', name: 'Neolithic', start: -4000, end: -3300 },
  { id: 'bronze-age', name: 'Bronze Age', start: -3300, end: -1200 },
  { id: 'axial-age', name: 'Axial Age', start: -1200, end: -300 },
  { id: 'classical', name: 'Classical', start: -300, end: 300 },
  { id: 'late-antiquity', name: 'Late Antiquity', start: 300, end: 600 },
  { id: 'medieval', name: 'Medieval', start: 600, end: 1450 },
  { id: 'age-of-sail', name: 'Age of Sail & Colonialism', start: 1450, end: 1800 },
  { id: 'industrial', name: 'Industrial', start: 1800, end: 1945 },
  { id: 'modern', name: 'Modern', start: 1945, end: CURRENT_YEAR },
]

export function eraForYear(year: number): Era | undefined {
  return ERAS.find((e) => year >= e.start && year < e.end)
}

import type { Polity } from '../types'
import { isRegionId } from '../config/regions'
import raw from '../../data/polities.json'

/**
 * Typed access to the main dataset with the same seatbelt checks as the
 * fixture loader. The authoritative validation (lane gaps, century
 * coverage, coverage report) lives in scripts/validate-data.ts.
 */
export function loadPolities(): Polity[] {
  const polities = raw.polities as Polity[]
  const ids = new Set(polities.map((p) => p.id))
  if (ids.size !== polities.length) {
    throw new Error('Duplicate polity ids in dataset')
  }
  for (const p of polities) {
    if (p.end < p.start) {
      throw new Error(`${p.id}: end ${p.end} precedes start ${p.start}`)
    }
    if (!isRegionId(p.region)) {
      throw new Error(`${p.id}: unknown region '${p.region}'`)
    }
    for (const ref of [
      ...(p.predecessors ?? []),
      ...(p.successors ?? []),
      ...(p.parent ? [p.parent] : []),
    ]) {
      if (!ids.has(ref)) throw new Error(`${p.id}: dangling reference '${ref}'`)
    }
  }
  return polities
}

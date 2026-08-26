import type { Polity } from '../types'
import { isRegionId } from '../config/regions'
import raw from '../../data/fixture-20.json'

/**
 * Typed access to the Phase 0 fixture, with just enough runtime checking to
 * catch a broken edit to the JSON. The full validation script with coverage
 * reporting arrives in Phase 3; this is a seatbelt, not the airbag.
 */
function assertPolity(p: Polity, ids: ReadonlySet<string>): void {
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

export function loadFixture(): Polity[] {
  const polities = raw.polities as Polity[]
  const ids = new Set(polities.map((p) => p.id))
  if (ids.size !== polities.length) {
    throw new Error('Duplicate polity ids in fixture')
  }
  for (const p of polities) assertPolity(p, ids)
  return polities
}

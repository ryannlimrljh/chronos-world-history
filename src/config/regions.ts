import type { Region, RegionId } from '../types'
import { deriveTints } from './color'

/**
 * The fourteen lanes, fixed west to east. Only lane *widths* flex over time;
 * this ordering never changes.
 *
 * Colour families are grouped so that a viewer squinting at the mosaic reads
 * continents without reading a word: Europe is blue, the Mediterranean and
 * North Africa are warm coral and amber, the Near East and Iran are green,
 * South and Southeast Asia are teal, East Asia is red.
 *
 * Families do repeat across lanes that sit far apart on the x-axis. That is
 * deliberate and matches the reference; the eye never compares them directly.
 */
const FAMILIES: Record<RegionId, { name: string; color: string }> = {
  'europe-west': { name: 'Western Europe', color: '#4E7FD9' },
  'europe-central': { name: 'Central & Northern Europe', color: '#77B34C' },
  mediterranean: { name: 'Mediterranean', color: '#F2724C' },
  'north-africa': { name: 'North Africa', color: '#F2A32E' },
  'sub-saharan-africa': { name: 'Sub-Saharan Africa', color: '#D07A28' },
  'near-east': { name: 'Near East & Anatolia', color: '#2FAE8A' },
  'iran-mesopotamia': { name: 'Iran & Mesopotamia', color: '#94BE42' },
  'central-asia-steppe': { name: 'Central Asian Steppe', color: '#5E96C4' },
  'south-asia': { name: 'South Asia', color: '#22A6A6' },
  'southeast-asia': { name: 'Southeast Asia', color: '#4EC48D' },
  'east-asia': { name: 'East Asia', color: '#D63F38' },
  'korea-japan': { name: 'Korea & Japan', color: '#F28638' },
  americas: { name: 'The Americas', color: '#6A6FD6' },
  oceania: { name: 'Oceania', color: '#66BAA2' },
}

/**
 * Fixed lane order per the brief. Mostly west to east across Afro-Eurasia;
 * the Americas sit at the eastern edge (rather than the true far west) so
 * the poster's top-left corner stays empty for the title block — the early
 * Andean towers would otherwise collide with it. Pre-Columbian America is
 * disconnected from the old world, so either edge is historically neutral.
 */
export const REGION_ORDER: readonly RegionId[] = [
  'europe-west',
  'europe-central',
  'mediterranean',
  'north-africa',
  'sub-saharan-africa',
  'near-east',
  'iran-mesopotamia',
  'central-asia-steppe',
  'south-asia',
  'southeast-asia',
  'east-asia',
  'korea-japan',
  'americas',
  'oceania',
]

export const REGIONS: readonly Region[] = REGION_ORDER.map((id, order) => ({
  id,
  name: FAMILIES[id].name,
  order,
  colorFamily: FAMILIES[id].color,
  tints: deriveTints(FAMILIES[id].color),
}))

const BY_ID = new Map(REGIONS.map((r) => [r.id, r]))

export function getRegion(id: RegionId): Region {
  const region = BY_ID.get(id)
  if (!region) throw new Error(`Unknown region id: ${id}`)
  return region
}

export function isRegionId(value: string): value is RegionId {
  return BY_ID.has(value as RegionId)
}

/**
 * Dataset validator and coverage report. Run: npm run validate:data
 *
 * Exits non-zero (failing any build that runs it) on:
 *  - end before start
 *  - unknown region ids
 *  - dangling predecessor / successor / parent references
 *  - duplicate ids
 *  - a >300-year gap with zero entries inside a lane's covered span
 *  - any century between the dataset's global start and now with zero
 *    polities alive anywhere on earth
 *
 * Also prints entries-per-lane-per-century so the shape of what is missing
 * is visible at a glance.
 */
import { readFileSync } from 'node:fs'
import type { Polity, RegionId } from '../src/types'
import { REGION_ORDER, isRegionId } from '../src/config/regions'

const MAX_LANE_GAP = 300
const CURRENT = 2026

const raw = JSON.parse(readFileSync('data/polities.json', 'utf8')) as {
  polities: Polity[]
}
const polities = raw.polities
const errors: string[] = []

// --- Referential integrity ------------------------------------------
const ids = new Set<string>()
for (const p of polities) {
  if (ids.has(p.id)) errors.push(`duplicate id: ${p.id}`)
  ids.add(p.id)
}
for (const p of polities) {
  if (p.end < p.start) errors.push(`${p.id}: end ${p.end} < start ${p.start}`)
  if (!isRegionId(p.region)) errors.push(`${p.id}: unknown region ${p.region}`)
  for (const ref of [
    ...(p.predecessors ?? []),
    ...(p.successors ?? []),
    ...(p.parent ? [p.parent] : []),
  ]) {
    if (!ids.has(ref)) errors.push(`${p.id}: dangling reference '${ref}'`)
  }
}

// --- Lane gap check --------------------------------------------------
for (const region of REGION_ORDER) {
  const lane = polities
    .filter((p) => p.region === region)
    .sort((a, b) => a.start - b.start)
  if (lane.length === 0) {
    errors.push(`lane ${region}: empty`)
    continue
  }
  let coveredTo = lane[0]!.start
  for (const p of lane) {
    if (p.start - coveredTo > MAX_LANE_GAP) {
      errors.push(
        `lane ${region}: gap of ${p.start - coveredTo} years ` +
          `(${coveredTo} to ${p.start}, before ${p.id})`,
      )
    }
    coveredTo = Math.max(coveredTo, p.end)
  }
}

// --- Global century coverage ----------------------------------------
const globalStart = Math.min(...polities.map((p) => p.start))
for (let c = Math.ceil(globalStart / 100) * 100; c < CURRENT; c += 100) {
  const alive = polities.some((p) => p.start <= c && p.end >= c)
  if (!alive) errors.push(`century ${c}: zero global coverage`)
}

// --- Coverage report -------------------------------------------------
const laneAbbrev: Record<RegionId, string> = {
  americas: 'AME', 'europe-west': 'EUW', 'europe-central': 'EUC',
  mediterranean: 'MED', 'north-africa': 'NAF', 'sub-saharan-africa': 'SSA',
  'near-east': 'NEA', 'iran-mesopotamia': 'IRM', 'central-asia-steppe': 'CAS',
  'south-asia': 'SAS', 'southeast-asia': 'SEA', 'east-asia': 'EAS',
  'korea-japan': 'KJP', oceania: 'OCE',
}
console.log('\n=== Coverage: polities alive per lane per century ===\n')
console.log(
  'century'.padStart(8) + ' ' +
    REGION_ORDER.map((r) => laneAbbrev[r].padStart(4)).join('') + '  total',
)
for (let c = -4000; c < CURRENT; c += 100) {
  const counts = REGION_ORDER.map(
    (region) =>
      polities.filter(
        (p) => p.region === region && p.start <= c + 100 && p.end >= c,
      ).length,
  )
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0 && c < -3000) continue // don't print the empty deep past
  const label = c < 0 ? `${-c} BCE` : `${c} CE`
  console.log(
    label.padStart(8) + ' ' +
      counts.map((n) => (n === 0 ? '   .' : String(n).padStart(4))).join('') +
      String(total).padStart(7),
  )
}
console.log(`\nTotal polities: ${polities.length}`)
const byConf = { high: 0, medium: 0, low: 0 }
for (const p of polities) byConf[p.confidence]++
console.log(
  `Confidence: high ${byConf.high}, medium ${byConf.medium}, low ${byConf.low}`,
)

// --- Verdict ---------------------------------------------------------
if (errors.length > 0) {
  console.error(`\nVALIDATION FAILED (${errors.length} errors):`)
  for (const e of errors) console.error('  - ' + e)
  process.exit(1)
}
console.log('\nValidation passed.')

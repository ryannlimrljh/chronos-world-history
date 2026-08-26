import type {
  LaneBand,
  LayoutConfig,
  LayoutResult,
  Polity,
  PositionedRect,
  RegionId,
} from '../types'
import { REGION_ORDER } from '../config/regions'

/**
 * The layout engine. Pure TypeScript: no React, no DOM, no randomness,
 * no clocks. Same input, same output, every time.
 *
 * The algorithm, in one breath: every polity becomes a rectangle whose
 * height is its lifespan on the time scale and whose width is its share of
 * the world's total significance *during its own lifetime*. Rectangles are
 * then pushed as far left as they can go, subject to two ordering rules —
 * a contemporary in a more western lane must sit fully to your west, and a
 * same-lane contemporary in an earlier sub-column must too — and one
 * gravitational pull: each rect is anchored near its lane's demand-weighted
 * home position, so geography stays readable even in sparse eras.
 *
 * Lane widths are never chosen; they emerge from where the rects land.
 * That is what produces the soft lanes, the ragged skyline and the
 * near-solid mosaic without ever letting a rectangle bend.
 */

interface WorkRect {
  polity: Polity
  laneOrder: number
  /**
   * Interval used for collision and demand. For parents this is stretched
   * to cover every descendant, so nothing packs into a child's footprint.
   */
  effStart: number
  effEnd: number
  subCol: number
  width: number
  anchor: number
  x: number
  /** Mean global demand across this rect's lifetime; low = sparse era. */
  meanTotal: number
}

const laneOrderOf = (region: RegionId): number => REGION_ORDER.indexOf(region)

/** Strict interval overlap. Touching endpoints do not collide, which lets a
 *  successor state continue vertically in the same column as its parent. */
const overlaps = (a: WorkRect, b: WorkRect): boolean =>
  a.effStart < b.effEnd && b.effStart < a.effEnd

/** Deterministic ordering used everywhere a tie needs breaking. */
const byStartThenId = (a: WorkRect, b: WorkRect): number =>
  a.effStart - b.effStart ||
  a.effEnd - b.effEnd ||
  (a.polity.id < b.polity.id ? -1 : 1)

export function layout(
  polities: readonly Polity[],
  config: LayoutConfig,
): LayoutResult {
  const { scale } = config
  const byId = new Map(polities.map((p) => [p.id, p]))

  // --- Separate nested children from continuation children -----------
  // Two kinds of parent/child relation, layouted differently:
  //   Nested: the child lived during the parent (Diadochi inside a
  //     Hellenistic band). Renders as an inset band inside the parent.
  //   Continuation: the child begins at or after the parent's end
  //     (Byzantium after Rome). It is packed as an ordinary rect — the
  //     succession-anchor rule makes it continue the parent's column —
  //     because forcing it inside the parent's footprint would let the
  //     child's later neighbours push the parent around.
  const childrenOf = new Map<string, Polity[]>()
  for (const p of polities) {
    if (!p.parent) continue
    const parent = byId.get(p.parent)
    if (!parent) throw new Error(`${p.id}: unknown parent`)
    if (p.start >= parent.end) continue // continuation: packed top-level
    const list = childrenOf.get(p.parent) ?? []
    list.push(p)
    childrenOf.set(p.parent, list)
  }
  const nestedIds = new Set(
    [...childrenOf.values()].flat().map((p) => p.id),
  )
  const topLevel = polities.filter((p) => !nestedIds.has(p.id))

  /** A parent's effective interval covers its whole subtree. */
  function effectiveInterval(p: Polity): [number, number] {
    let start = p.start
    let end = p.end
    for (const child of childrenOf.get(p.id) ?? []) {
      const [cs, ce] = effectiveInterval(child)
      start = Math.min(start, cs)
      end = Math.max(end, ce)
    }
    return [start, end]
  }

  const work: WorkRect[] = topLevel.map((polity) => {
    const [effStart, effEnd] = effectiveInterval(polity)
    return {
      polity,
      laneOrder: laneOrderOf(polity.region),
      effStart,
      effEnd,
      subCol: 0,
      width: 0,
      anchor: 0,
      x: 0,
      meanTotal: 0,
    }
  })

  // --- Demand per slice ----------------------------------------------
  // A slice is a horizontal band of years. Demand in a slice is the summed
  // significance of everything alive in it, per lane. This is the engine's
  // picture of "how much is happening, where, when".
  const minYear = scale.minYear
  const maxYear = scale.maxYear
  const nSlices = Math.max(
    1,
    Math.ceil((maxYear - minYear) / config.sliceYears),
  )
  const laneCount = REGION_ORDER.length
  // demand[slice][lane]
  const demand: number[][] = Array.from({ length: nSlices }, () =>
    new Array<number>(laneCount).fill(0),
  )
  const sliceOf = (year: number): number =>
    Math.min(
      nSlices - 1,
      Math.max(0, Math.floor((year - minYear) / config.sliceYears)),
    )

  for (const r of work) {
    const s0 = sliceOf(r.effStart)
    const s1 = sliceOf(r.effEnd - 1e-9)
    for (let s = s0; s <= s1; s++) {
      demand[s]![r.laneOrder]! += r.polity.significance
    }
  }
  const totalDemand = demand.map((row) => row.reduce((a, b) => a + b, 0))
  // Demand west of each lane, per slice, for anchor computation.
  const westDemand: number[][] = demand.map((row) => {
    const cum = new Array<number>(laneCount).fill(0)
    let acc = 0
    for (let l = 0; l < laneCount; l++) {
      cum[l] = acc
      acc += row[l]!
    }
    return cum
  })

  // --- Width and anchor per rect --------------------------------------
  // Width = my significance as a fraction of the world's mean total
  // significance across my lifetime, of the target canvas width. Rome with
  // few rivals is broad; a small kingdom in a crowded century is a sliver.
  //
  // The divisor is floored so that near-empty millennia produce narrow
  // isolated towers rather than full-canvas slabs: in a sparse era a rect's
  // width is driven by its own significance, not by the emptiness around it.
  const DEMAND_FLOOR = 24

  // Each lane's all-of-history home position, used to keep geography honest
  // when a rect's own lifetime is too sparse to say where west ends.
  const grandTotal = totalDemand.reduce((a, b) => a + b, 0) || 1
  const staticWestFraction: number[] = []
  for (let l = 0; l < laneCount; l++) {
    let west = 0
    for (let s = 0; s < nSlices; s++) west += westDemand[s]![l]!
    staticWestFraction.push(west / grandTotal)
  }

  for (const r of work) {
    const s0 = sliceOf(r.effStart)
    const s1 = sliceOf(r.effEnd - 1e-9)
    let sumTotal = 0
    let sumWest = 0
    const n = s1 - s0 + 1
    for (let s = s0; s <= s1; s++) {
      sumTotal += Math.max(totalDemand[s]!, 1)
      sumWest += westDemand[s]![r.laneOrder]!
    }
    const meanTotal = Math.max(sumTotal / n, DEMAND_FLOOR)
    r.meanTotal = sumTotal / n
    const lifeWestFraction = sumWest / n / meanTotal
    const westFraction =
      0.5 * lifeWestFraction + 0.5 * staticWestFraction[r.laneOrder]!
    r.width = Math.max(
      config.minRectWidth,
      (r.polity.significance / meanTotal) * config.width,
    )
    r.anchor = westFraction * config.width * config.anchorStrength
  }

  // --- Sub-column assignment within each lane -------------------------
  // Classic greedy interval colouring: sort by start, take the leftmost
  // sub-column whose previous occupant has already ended.
  const lanes = new Map<number, WorkRect[]>()
  for (const r of work) {
    const list = lanes.get(r.laneOrder) ?? []
    list.push(r)
    lanes.set(r.laneOrder, list)
  }
  for (const list of lanes.values()) {
    list.sort(byStartThenId)
    const colEnds: number[] = []
    for (const r of list) {
      let placed = false
      for (let c = 0; c < colEnds.length; c++) {
        if (r.effStart >= colEnds[c]!) {
          r.subCol = c
          colEnds[c] = r.effEnd
          placed = true
          break
        }
      }
      if (!placed) {
        r.subCol = colEnds.length
        colEnds.push(r.effEnd)
      }
    }
  }

  // --- Constraint pass: leftmost feasible x ---------------------------
  // Process west to east. Each rect starts at its anchor and is pushed
  // right just far enough to clear every contemporary that must sit to
  // its west. Sorting by (lane, subCol, start) guarantees all such
  // predecessors are already placed.
  const ordered = [...work].sort(
    (a, b) =>
      a.laneOrder - b.laneOrder || a.subCol - b.subCol || byStartThenId(a, b),
  )
  const placed: WorkRect[] = []
  // Last placed occupant of each (lane, subCol), for succession chains.
  const lastInCol = new Map<string, WorkRect>()
  for (const r of ordered) {
    // A rect that begins exactly where its column's previous occupant ended
    // is a succession (Republic -> Empire, Sumer -> Akkad). Inherit the
    // predecessor's x as the anchor so the chain reads as one vertical run
    // instead of drifting with each era's demand profile.
    const colKey = `${r.laneOrder}:${r.subCol}`
    const prev = lastInCol.get(colKey)
    let x =
      prev && prev.effEnd === r.effStart ? Math.min(r.anchor, prev.x) : r.anchor
    for (const p of placed) {
      const mustBeWest =
        p.laneOrder < r.laneOrder ||
        (p.laneOrder === r.laneOrder && p.subCol < r.subCol)
      if (mustBeWest && overlaps(p, r)) {
        x = Math.max(x, p.x + p.width + config.gap)
      }
    }
    r.x = x
    placed.push(r)
    lastInCol.set(colKey, r)
  }

  // --- Widening pass: fill horizontal holes ---------------------------
  // The mosaic must read near-solid. Nothing moves; instead each rect
  // grows rightward until it meets the nearest contemporary to its east,
  // capped so a sliver can never balloon into a slab. Two passes, west to
  // east, because a widened rect closes its neighbour's measurement.
  for (let pass = 0; pass < 2; pass++) {
    const byX = [...work].sort((a, b) => a.x - b.x || byStartThenId(a, b))
    for (const r of byX) {
      let nearestEast = Infinity
      for (const e of work) {
        if (e === r || !overlaps(e, r)) continue
        if (e.x >= r.x + r.width - 0.001) {
          nearestEast = Math.min(nearestEast, e.x)
        }
      }
      if (nearestEast === Infinity) continue
      const gap = nearestEast - (r.x + r.width) - config.gap
      if (gap <= 0) continue
      // Era-aware cap: in a crowded century a rect may grow to seal the
      // mosaic; in an empty millennium it stays a narrow tower and the
      // whitespace around it becomes part of the composition.
      const density = Math.min(r.meanTotal / DEMAND_FLOOR, 2)
      const cap = r.width * (0.25 + density)
      r.width = r.width + Math.min(gap, cap)
    }
  }

  // --- Emit rects, recursing into children ----------------------------
  const rects: PositionedRect[] = []

  function emit(
    polity: Polity,
    x: number,
    width: number,
    depth: number,
  ): void {
    const y0 = scale.yearToY(polity.start)
    const y1 = scale.yearToY(polity.end)
    rects.push({
      polityId: polity.id,
      x,
      y: y0,
      width,
      height: Math.max(y1 - y0, 1),
      region: polity.region,
      significance: polity.significance,
      depth,
    })
    const kids = childrenOf.get(polity.id)
    if (!kids || kids.length === 0) return

    // Children pack into sub-columns inside the parent's inner width,
    // splitting it proportionally to significance per sub-column.
    const innerX = x + config.nestInset
    const innerW = Math.max(width - config.nestInset * 2, config.minRectWidth)
    const sorted = [...kids].sort(
      (a, b) => a.start - b.start || (a.id < b.id ? -1 : 1),
    )
    const colEnds: number[] = []
    const colOf = new Map<string, number>()
    const colSig: number[] = []
    for (const k of sorted) {
      let placed2 = false
      for (let c = 0; c < colEnds.length; c++) {
        if (k.start >= colEnds[c]!) {
          colOf.set(k.id, c)
          colEnds[c] = k.end
          colSig[c] = Math.max(colSig[c]!, k.significance)
          placed2 = true
          break
        }
      }
      if (!placed2) {
        colOf.set(k.id, colEnds.length)
        colEnds.push(k.end)
        colSig.push(k.significance)
      }
    }
    const sigSum = colSig.reduce((a, b) => a + b, 0)
    const colX: number[] = []
    let acc = innerX
    for (const sig of colSig) {
      colX.push(acc)
      acc += (sig / sigSum) * innerW
    }
    for (const k of sorted) {
      const c = colOf.get(k.id)!
      emit(k, colX[c]!, (colSig[c]! / sigSum) * innerW, depth + 1)
    }
  }

  for (const r of work) emit(r.polity, r.x, r.width, 0)

  // --- Lane bands: emergent, read off the placed rects ----------------
  const bands: LaneBand[] = []
  for (let s = 0; s < nSlices; s++) {
    const yStart = scale.yearToY(minYear + s * config.sliceYears)
    const yEnd = scale.yearToY(
      Math.min(minYear + (s + 1) * config.sliceYears, maxYear),
    )
    for (const [laneOrder, list] of lanes) {
      const sliceStart = minYear + s * config.sliceYears
      const sliceEnd = sliceStart + config.sliceYears
      const alive = list.filter(
        (r) => r.effStart < sliceEnd && r.effEnd > sliceStart,
      )
      if (alive.length === 0) continue
      const x = Math.min(...alive.map((r) => r.x))
      const right = Math.max(...alive.map((r) => r.x + r.width))
      bands.push({
        region: REGION_ORDER[laneOrder]!,
        sliceIndex: s,
        yStart,
        yEnd,
        x,
        width: right - x,
      })
    }
  }

  const maxRight = rects.reduce((m, r) => Math.max(m, r.x + r.width), 0)
  return { rects, bands, width: maxRight, height: scale.height }
}

import type {
  LaneBand,
  LayoutConfig,
  LayoutResult,
  Polity,
  PositionedRect,
  RegionId,
  Run,
} from '../types'
import { REGION_ORDER } from '../config/regions'

/**
 * The layout engine, Histomap edition. Pure TypeScript: no React, no DOM,
 * no randomness, no clocks. Same input, same output, every time.
 *
 * The reference poster has no holes because its blocks are not rectangles:
 * they are stepped shapes, and at every horizontal slice of the sheet the
 * blocks alive at that moment tile the row completely. Its fine print
 * confesses the other half of the trick: dates are rounded to a grid so
 * that handoffs happen exactly at slice boundaries.
 *
 * This engine does the same. Time is cut into slices; each slice's row
 * width is the summed weight of everyone alive in it; the row is tiled
 * west to east with each polity's constant-width slot. A polity's edges
 * therefore move only when a neighbour is born or dies, which produces
 * the reference's long steady edges and crisp steps. Geometry snaps each
 * polity's years to the slice grid (exact dates stay in the data and the
 * UI); tiling makes gaps impossible by construction.
 */

interface WorkShape {
  polity: Polity
  laneOrder: number
  /** Interval covering the polity plus every nested descendant. */
  effStart: number
  effEnd: number
  /** Effective (subtree) years snapped to the grid; the slot lives this long. */
  snapStart: number
  snapEnd: number
  /** The polity's OWN snapped years; its painted shape is clipped to these. */
  ownSnapStart: number
  ownSnapEnd: number
  subCol: number
  stackIndex: number
  weight: number
  /** Per-slice horizontal extent, filled by the tiling pass. */
  extents: Map<number, [number, number]>
}

const laneOrderOf = (region: RegionId): number => REGION_ORDER.indexOf(region)

const byStartThenId = (a: WorkShape, b: WorkShape): number =>
  a.effStart - b.effStart ||
  a.effEnd - b.effEnd ||
  (a.polity.id < b.polity.id ? -1 : 1)

/** Width grows superlinearly with significance so era-defining empires
 *  dominate their rows the way the reference's do. */
const weightOf = (sig: number): number => sig ** 1.5

export function layout(
  polities: readonly Polity[],
  config: LayoutConfig,
): LayoutResult {
  const { scale, sliceYears } = config
  const byId = new Map(polities.map((p) => [p.id, p]))

  // --- Nested children vs continuation children -----------------------
  // A child alive during its parent nests inside the parent's shape. A
  // child beginning at or after the parent's end is a continuation and
  // packs as an ordinary top-level shape.
  const childrenOf = new Map<string, Polity[]>()
  for (const p of polities) {
    if (!p.parent) continue
    const parent = byId.get(p.parent)
    if (!parent) throw new Error(`${p.id}: unknown parent`)
    if (p.start >= parent.end) continue
    const list = childrenOf.get(p.parent) ?? []
    list.push(p)
    childrenOf.set(p.parent, list)
  }
  const nestedIds = new Set([...childrenOf.values()].flat().map((p) => p.id))
  const topLevel = polities.filter((p) => !nestedIds.has(p.id))

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

  // The reference's fine print rounds dates to a 50-year grid in the
  // ancient stretch. Coarser snapping clusters births and deaths onto
  // shared boundaries, which is what turns edge jitter into the crisp
  // collective steps of the original.
  const snap = (year: number): number => {
    const grid = year < 1000 ? Math.max(sliceYears * 2, 50) : sliceYears
    return Math.round(year / grid) * grid
  }

  const work: WorkShape[] = topLevel.map((polity) => {
    const [effStart, effEnd] = effectiveInterval(polity)
    let snapStart = snap(effStart)
    let snapEnd = snap(effEnd)
    if (snapEnd <= snapStart) snapEnd = snapStart + sliceYears
    let ownSnapStart = snap(polity.start)
    let ownSnapEnd = snap(polity.end)
    if (ownSnapEnd <= ownSnapStart) ownSnapEnd = ownSnapStart + sliceYears
    return {
      polity,
      laneOrder: laneOrderOf(polity.region),
      effStart,
      effEnd,
      snapStart,
      snapEnd,
      ownSnapStart,
      ownSnapEnd,
      subCol: 0,
      stackIndex: 0,
      weight: weightOf(polity.significance),
      extents: new Map(),
    }
  })

  // --- Sub-columns: a stable west-to-east order within each lane ------
  const lanes = new Map<number, WorkShape[]>()
  for (const s of work) {
    const list = lanes.get(s.laneOrder) ?? []
    list.push(s)
    lanes.set(s.laneOrder, list)
  }
  // Succession links: a polity knows its predecessors, and inherits their
  // track when it is free — Tang hands its column to Song, Rome's line
  // stacks in one pillar, exactly as the reference draws dynasties.
  const predsOf = new Map<string, Set<string>>()
  for (const s of work) {
    predsOf.set(s.polity.id, new Set(s.polity.predecessors ?? []))
  }
  for (const s of work) {
    for (const succ of s.polity.successors ?? []) {
      predsOf.get(succ)?.add(s.polity.id)
    }
  }
  for (const list of lanes.values()) {
    list.sort(byStartThenId)
    const colEnds: number[] = []
    const colCount: number[] = []
    const assigned = new Map<string, number>()
    for (const s of list) {
      let chosen = -1
      // First choice: a free track already used by a predecessor.
      for (const predId of predsOf.get(s.polity.id) ?? []) {
        const c = assigned.get(predId)
        if (c !== undefined && s.snapStart >= colEnds[c]!) {
          chosen = c
          break
        }
      }
      // Otherwise the leftmost free track, or a new one.
      if (chosen < 0) {
        for (let c = 0; c < colEnds.length; c++) {
          if (s.snapStart >= colEnds[c]!) {
            chosen = c
            break
          }
        }
      }
      if (chosen < 0) {
        chosen = colEnds.length
        colEnds.push(0)
        colCount.push(0)
      }
      s.subCol = chosen
      s.stackIndex = colCount[chosen]!
      colEnds[chosen] = s.snapEnd
      colCount[chosen] = colCount[chosen]! + 1
      assigned.set(s.polity.id, chosen)
    }
  }

  // --- Slices and demand ----------------------------------------------
  const minYear = scale.minYear
  const maxYear = scale.maxYear
  const nSlices = Math.max(1, Math.ceil((maxYear - minYear) / sliceYears))
  const sliceStartYear = (i: number): number => minYear + i * sliceYears
  const aliveAt = (s: WorkShape, i: number): boolean =>
    s.snapStart < sliceStartYear(i) + sliceYears &&
    s.snapEnd > sliceStartYear(i)

  const alivePerSlice: WorkShape[][] = []
  let maxDemand = 0
  for (let i = 0; i < nSlices; i++) {
    const alive = work
      .filter((s) => aliveAt(s, i))
      .sort(
        (a, b) =>
          a.laneOrder - b.laneOrder ||
          a.subCol - b.subCol ||
          byStartThenId(a, b),
      )
    alivePerSlice.push(alive)
    maxDemand = Math.max(
      maxDemand,
      alive.reduce((sum, s) => sum + s.weight, 0),
    )
  }
  const unit = config.width / Math.max(maxDemand, 1)
  // Sparse rows get a width boost so the ancient towers hold their own
  // against the crowded medieval mass, as they do in the reference.
  const rowScale = (demand: number): number =>
    Math.min((maxDemand / Math.max(demand, 1)) ** 0.25, 2.2)

  // --- Track tiling: columns stay put, successors stack ---------------
  // Alignment comes from tracks (a lane's sub-columns). A track's width
  // is HELD constant for as long as it stays occupied — successors stack
  // vertically at the same x, which is what makes the reference's Rome
  // column read as one straight bar through Kingdom, Republic and Empire.
  // The width steps only when a track empties or its occupant's natural
  // size departs drastically from the held value. Rows still tile with
  // zero gaps: every held width is packed edge to edge.
  const globalDemand: number[] = new Array(nSlices).fill(0)
  for (let i = 0; i < nSlices; i++) {
    for (const s of alivePerSlice[i]!) globalDemand[i]! += s.weight
  }
  const heldW = new Map<string, number>()
  for (let i = 0; i < nSlices; i++) {
    const year = sliceStartYear(i)
    const reserve = config.titleReserve
    let cum = reserve && year < reserve.untilYear ? reserve.width : 0
    const boost = rowScale(globalDemand[i]!)
    const seen = new Set<string>()
    for (const s of alivePerSlice[i]!) {
      const key = `${s.laneOrder}:${s.subCol}`
      seen.add(key)
      const natural = Math.max(s.weight * unit * boost, config.minRectWidth)
      const prev = heldW.get(key)
      let w: number
      if (prev === undefined || Math.abs(natural - prev) > Math.max(12, prev * 0.45)) {
        w = natural
        heldW.set(key, natural)
      } else {
        w = prev
      }
      s.extents.set(i, [cum, cum + w])
      cum += w + config.gap
    }
    // A track that fell empty forgets its width; the next occupant
    // starts a fresh column.
    for (const key of [...heldW.keys()]) {
      if (!seen.has(key)) heldW.delete(key)
    }
  }

  // --- Emit shapes, merging identical consecutive slices into runs ----
  const rects: PositionedRect[] = []

  function runsFromExtents(
    extents: Map<number, [number, number]>,
    clipStartYear: number,
    clipEndYear: number,
  ): Run[] {
    const indices = [...extents.keys()].sort((a, b) => a - b)
    const runs: Run[] = []
    for (const i of indices) {
      const [x0, x1] = extents.get(i)!
      const y0 = scale.yearToY(Math.max(sliceStartYear(i), clipStartYear))
      const y1 = scale.yearToY(
        Math.min(sliceStartYear(i) + sliceYears, clipEndYear),
      )
      if (y1 <= y0) continue
      const prev = runs[runs.length - 1]
      if (prev && Math.abs(prev.x0 - x0) < 0.01 && Math.abs(prev.x1 - x1) < 0.01) {
        prev.y1 = y1
      } else {
        runs.push({ y0, y1, x0, x1 })
      }
    }
    return runs
  }

  function emit(
    polity: Polity,
    extents: Map<number, [number, number]>,
    snapStart: number,
    snapEnd: number,
    depth: number,
    track: number,
    stackIndex: number,
    /** How long the slot itself lives (covers continuation children). */
    slotEnd: number = snapEnd,
  ): void {
    void slotEnd
    const runs = runsFromExtents(extents, snapStart, snapEnd)
    if (runs.length === 0) return
    const x = Math.min(...runs.map((r) => r.x0))
    const right = Math.max(...runs.map((r) => r.x1))
    const y = runs[0]!.y0
    const bottom = runs[runs.length - 1]!.y1
    rects.push({
      polityId: polity.id,
      x,
      y,
      width: right - x,
      height: Math.max(bottom - y, 1),
      runs,
      region: polity.region,
      significance: polity.significance,
      track,
      stackIndex,
      depth,
    })

    // Nested children split the parent's inner width per slice.
    const kids = childrenOf.get(polity.id)
    if (!kids || kids.length === 0) return
    const sorted = [...kids].sort(
      (a, b) => a.start - b.start || (a.id < b.id ? -1 : 1),
    )
    const kidShapes = sorted.map((k) => {
      let ks = snap(k.start)
      let ke = snap(k.end)
      if (ke <= ks) ke = ks + sliceYears
      return { k, ks, ke, extents: new Map<number, [number, number]>() }
    })
    for (const i of extents.keys()) {
      const [px0, px1] = extents.get(i)!
      const year = sliceStartYear(i)
      // While the parent lives, children are inset bands inside it; after
      // it ends they inherit the full slot, exactly as Byzantium fills
      // Rome's footprint in the reference.
      const inset = year < snapEnd ? config.nestInset : 0
      const inner0 = px0 + inset
      const inner1 = px1 - inset
      const aliveKids = kidShapes.filter(
        (ks2) => ks2.ks < year + sliceYears && ks2.ke > year,
      )
      if (aliveKids.length === 0) continue
      const total = aliveKids.reduce(
        (sum, ks2) => sum + weightOf(ks2.k.significance),
        0,
      )
      let cum = inner0
      for (const ks2 of aliveKids) {
        const w = ((inner1 - inner0) * weightOf(ks2.k.significance)) / total
        ks2.extents.set(i, [cum, cum + w])
        cum += w
      }
    }
    kidShapes.forEach((ks2, idx) => {
      emit(ks2.k, ks2.extents, ks2.ks, ks2.ke, depth + 1, track, stackIndex + idx + 1)
    })
  }

  for (const s of work) {
    emit(
      s.polity,
      s.extents,
      s.ownSnapStart,
      s.ownSnapEnd,
      0,
      s.subCol,
      s.stackIndex,
      s.snapEnd,
    )
  }

  // --- Lane bands for the sticky region header ------------------------
  const bands: LaneBand[] = []
  for (let i = 0; i < nSlices; i++) {
    const perLane = new Map<number, [number, number]>()
    for (const s of alivePerSlice[i]!) {
      const [x0, x1] = s.extents.get(i)!
      const cur = perLane.get(s.laneOrder)
      perLane.set(
        s.laneOrder,
        cur ? [Math.min(cur[0], x0), Math.max(cur[1], x1)] : [x0, x1],
      )
    }
    const yStart = scale.yearToY(sliceStartYear(i))
    const yEnd = scale.yearToY(
      Math.min(sliceStartYear(i) + sliceYears, maxYear),
    )
    for (const [laneOrder, [x0, x1]] of perLane) {
      bands.push({
        region: REGION_ORDER[laneOrder]!,
        sliceIndex: i,
        yStart,
        yEnd,
        x: x0,
        width: x1 - x0,
      })
    }
  }

  const maxRight = rects.reduce((m, r) => Math.max(m, r.x + r.width), 0)
  return { rects, bands, width: maxRight, height: scale.height }
}

/**
 * Single source of truth for Chronos.
 *
 * Everything else in the app derives from these types: the dataset, the
 * layout engine, the renderer, the store. If a shape needs to change, it
 * changes here first.
 */

/** Astronomical-style year. Negative is BCE. There is no year zero. */
export type Year = number

/** The current year, used as the `end` for polities that still exist. */
export const CURRENT_YEAR: Year = 2026

/**
 * How much to trust a date. This is about the *dating*, not about whether
 * the polity existed. Old Kingdom Egypt certainly existed; when it started
 * is another matter.
 */
export type Precision = 'exact' | 'circa' | 'century' | 'disputed'

export type RegionId =
  | 'europe-west'
  | 'europe-central'
  | 'mediterranean'
  | 'north-africa'
  | 'sub-saharan-africa'
  | 'near-east'
  | 'iran-mesopotamia'
  | 'central-asia-steppe'
  | 'south-asia'
  | 'southeast-asia'
  | 'east-asia'
  | 'korea-japan'
  | 'americas'
  | 'oceania'

export type PolityCategory =
  | 'empire'
  | 'kingdom'
  | 'dynasty'
  | 'republic'
  | 'caliphate'
  | 'khanate'
  | 'confederation'
  | 'city-state'
  | 'colonial'
  | 'modern-state'

/** 5 = Rome, Han, the Ottomans. Drives how wide the rectangle gets. */
export type Significance = 1 | 2 | 3 | 4 | 5

export type Confidence = 'high' | 'medium' | 'low'

export interface Polity {
  /** Slug, e.g. 'tang-dynasty'. Unique across the dataset. */
  id: string
  name: string
  /** 唐朝, Imperium Romanum, and so on. */
  nameNative?: string
  /** Alternate names, folded into search. */
  aka?: string[]
  start: Year
  end: Year
  startPrecision: Precision
  endPrecision: Precision
  region: RegionId
  subregion?: string
  category: PolityCategory
  significance: Significance
  predecessors?: string[]
  successors?: string[]
  /** Renders as an inset band inside the parent's rectangle, not beside it. */
  parent?: string
  capital?: string
  /** One or two sentences. Plain. No adjectival hype. */
  blurb: string
  /** Confidence in the dating above, not in the existence of the polity. */
  confidence: Confidence
  wikipedia?: string
}

export type EventCategory =
  | 'technology'
  | 'religion'
  | 'conflict'
  | 'exchange'
  | 'science'
  | 'text'

export interface HistoricalEvent {
  id: string
  year: Year
  precision: Precision
  title: string
  category: EventCategory
  blurb: string
  relatedPolities?: string[]
}

export interface Era {
  id: string
  name: string
  start: Year
  end: Year
}

export interface Region {
  id: RegionId
  name: string
  /** Fixed west-to-east ordering. Lower sorts further left. */
  order: number
  /**
   * Base colour family for the lane, as flat opaque hex. Tints for category
   * and for adjacent-block separation are derived from this at render time.
   */
  colorFamily: string
  /** Ordered tints within the family, light to dark. */
  tints: readonly string[]
}

/* ------------------------------------------------------------------ */
/* Layout engine contract                                              */
/* ------------------------------------------------------------------ */

/**
 * Maps a year to a vertical pixel position and back. Swappable so the
 * piecewise scale can be traded for a linear or log one without touching
 * the packing code.
 */
export interface TimeScale {
  readonly id: string
  yearToY(year: Year): number
  yToYear(y: number): Year
  /** Total pixel height of the full timespan. */
  readonly height: number
  readonly minYear: Year
  readonly maxYear: Year
}

export interface LayoutConfig {
  scale: TimeScale
  /**
   * Target horizontal pixels for the mosaic at the busiest moment in
   * history. Actual bounds can differ slightly; the renderer fits to them.
   */
  width: number
  /** Height in years of each horizontal analysis slice. */
  sliceYears: number
  /** Horizontal gap in pixels between adjacent rects. 0 = shared hairlines. */
  gap: number
  /** Inset in pixels applied on each side when nesting a child in a parent. */
  nestInset: number
  /** Narrowest a rect may render, so significance-1 slivers stay visible. */
  minRectWidth: number
  /**
   * 0..1. How strongly a rect is pulled toward its lane's demand-weighted
   * home position versus packed hard left against its neighbours. Higher
   * keeps geography honest; lower packs tighter.
   */
  anchorStrength: number
  /**
   * Poster corner reserved for the title block: rects alive before
   * `untilYear` may not sit west of `width`. Keeps the top-left clear.
   */
  titleReserve?: { untilYear: Year; width: number }
}

/** One horizontal band of a stepped shape. */
export interface Run {
  y0: number
  y1: number
  x0: number
  x1: number
}

/**
 * A laid-out polity. Not necessarily a rectangle: `runs` is the stepped
 * outline (Histomap-style), top to bottom; x/y/width/height is its
 * bounding box, kept for camera framing, pulses and comparisons.
 */
export interface PositionedRect {
  polityId: string
  x: number
  y: number
  width: number
  height: number
  /** Stepped outline, top to bottom. A plain rectangle has one run. */
  runs: Run[]
  region: RegionId
  significance: Significance
  /** Nesting depth. 0 is a top-level rect, 1 is a child inside a parent. */
  depth: number
}

/** A lane's horizontal extent for one time slice, after smoothing. */
export interface LaneBand {
  region: RegionId
  sliceIndex: number
  yStart: number
  yEnd: number
  x: number
  width: number
}

export interface LayoutResult {
  rects: PositionedRect[]
  bands: LaneBand[]
  width: number
  height: number
}

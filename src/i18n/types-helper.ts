// Local re-exports so zh.ts can type its records without circular pain.
export type { PolityCategory, RegionId } from '../types'
export type EraId =
  | 'neolithic' | 'bronze-age' | 'axial-age' | 'classical'
  | 'late-antiquity' | 'medieval' | 'age-of-sail' | 'industrial' | 'modern'

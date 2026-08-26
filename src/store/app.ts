import { create } from 'zustand'
import type { PolityCategory, RegionId, Year } from '../types'
import type { Lang } from '../i18n'

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem('chronos-lang')
    if (stored === 'zh' || stored === 'en') return stored
  } catch {
    /* storage unavailable */
  }
  return 'en'
}

/**
 * Application state beyond the camera: hover, selection, filters, the time
 * cursor and the compare set. Explore, Tour and the URL sync all read and
 * write this one store.
 *
 * Filtering never removes rects. Filtered-out rects desaturate to 15%
 * opacity so the viewer keeps the spatial memory of the whole mosaic.
 */

export interface FilterState {
  /** Empty set = no region filter (all shown). */
  regions: ReadonlySet<RegionId>
  /** Empty set = no category filter. */
  categories: ReadonlySet<PolityCategory>
  /** Era ids; empty = no era filter. */
  eras: ReadonlySet<string>
  /** Minimum significance, 1 = everything. */
  minSignificance: number
}

export const EMPTY_FILTERS: FilterState = {
  regions: new Set(),
  categories: new Set(),
  eras: new Set(),
  minSignificance: 1,
}

interface AppState {
  hoveredId: string | null
  selectedId: string | null
  /** Up to 4 polity ids pinned for comparison via shift-click. */
  compareIds: readonly string[]
  filters: FilterState
  /** Year the draggable time cursor sits at; null = cursor hidden. */
  timeCursor: Year | null
  searchOpen: boolean
  filtersOpen: boolean
  /** Id pulsed after a search jump; cleared by the pulse overlay itself. */
  pulseId: string | null
  lang: Lang

  setHovered(id: string | null): void
  select(id: string | null): void
  toggleCompare(id: string): void
  clearCompare(): void
  setFilters(patch: Partial<FilterState>): void
  resetFilters(): void
  setTimeCursor(year: Year | null): void
  setSearchOpen(open: boolean): void
  setFiltersOpen(open: boolean): void
  setPulse(id: string | null): void
  setLang(lang: Lang): void
}

export const useAppStore = create<AppState>((set) => ({
  hoveredId: null,
  selectedId: null,
  compareIds: [],
  filters: EMPTY_FILTERS,
  timeCursor: null,
  searchOpen: false,
  filtersOpen: false,
  pulseId: null,
  lang: initialLang(),

  setHovered: (hoveredId) => set({ hoveredId }),
  select: (selectedId) => set({ selectedId }),
  toggleCompare: (id) =>
    set((s) => ({
      compareIds: s.compareIds.includes(id)
        ? s.compareIds.filter((c) => c !== id)
        : s.compareIds.length < 4
          ? [...s.compareIds, id]
          : s.compareIds,
    })),
  clearCompare: () => set({ compareIds: [] }),
  setFilters: (patch) =>
    set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: EMPTY_FILTERS }),
  setTimeCursor: (timeCursor) => set({ timeCursor }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setFiltersOpen: (filtersOpen) => set({ filtersOpen }),
  setPulse: (pulseId) => set({ pulseId }),
  setLang: (lang) => {
    try {
      localStorage.setItem('chronos-lang', lang)
    } catch {
      /* fine */
    }
    set({ lang })
  },
}))

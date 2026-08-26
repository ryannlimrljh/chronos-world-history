import { useAppStore } from '../store/app'

/**
 * The right rail's distance from the edge. When the detail drawer is
 * open, everything on the right shifts smoothly out of its way instead
 * of being buried underneath it.
 */
export const DRAWER_WIDTH = 380

export function useRightOffset(): number {
  const selected = useAppStore((s) => s.selectedId)
  return selected ? DRAWER_WIDTH + 14 : 14
}
